import type { SanityClient } from '@sanity/client';
import { pAllSettled } from './concurrency.js';
import { downloadAndUpload } from './images.js';
import { parseWXRFromString } from './parser.js';
import { authorDocId, categoryDocId, pageDocId, postDocId, slugify } from './slugify.js';
import { extractImageUrls, htmlToPortableText, stripHtml } from './transformer.js';
import type { MigrationResult, RunMigrationInput, WXRData, WXRPost } from './types.js';

type SanityDoc = { _id: string; _type: string } & Record<string, unknown>;

/**
 * Run a full WXR -> Sanity migration. Pure of CLI concerns: progress is
 * reported through `onProgress`, errors are thrown.
 */
export async function runMigration(input: RunMigrationInput): Promise<MigrationResult> {
  const data = parseWXRFromString(input.xml);
  input.onProgress?.({
    phase: 'parse',
    postsCount: data.posts.length,
    authorsCount: data.authors.length,
    termsCount: data.terms.length,
  });

  const filterType = input.postType ?? 'post';
  const items = data.posts.filter(
    (p) => p.status === 'publish' && (filterType === 'all' ? true : p.postType === filterType),
  );

  await migrateAuthors(data, input);
  const categoriesCount = await migrateCategories(data, input);
  const { imageMap, imagesUploaded, imagesFailed } = await migrateImages(items, input);
  const postsMigrated = await migratePosts(items, data, input.client, imageMap, input);

  const result: MigrationResult = {
    postsMigrated,
    imagesUploaded,
    imagesFailed,
    authorsCount: data.authors.length,
    categoriesCount,
  };

  input.onProgress?.({
    phase: 'complete',
    postsMigrated,
    imagesUploaded,
    imagesFailed,
  });

  return result;
}

async function migrateAuthors(data: WXRData, input: RunMigrationInput): Promise<void> {
  if (!data.authors.length) return;
  const tx = input.client.transaction();
  for (const a of data.authors) {
    tx.createOrReplace({
      _id: authorDocId(a.login),
      _type: 'author',
      name: a.displayName,
      slug: { _type: 'slug', current: slugify(a.login) },
      ...(a.lastName || a.firstName
        ? { bio: [a.firstName, a.lastName].filter(Boolean).join(' ') }
        : {}),
    });
  }
  await tx.commit();
  input.onProgress?.({
    phase: 'authors',
    processed: data.authors.length,
    total: data.authors.length,
  });
}

async function migrateCategories(data: WXRData, input: RunMigrationInput): Promise<number> {
  const cats = data.terms.filter((t) => t.taxonomy === 'category');
  if (!cats.length) return 0;
  const tx = input.client.transaction();
  for (const c of cats) {
    tx.createOrReplace({
      _id: categoryDocId(c.slug),
      _type: 'category',
      title: c.name,
      slug: { _type: 'slug', current: slugify(c.slug) },
    });
  }
  await tx.commit();
  input.onProgress?.({ phase: 'categories', processed: cats.length, total: cats.length });
  return cats.length;
}

async function migrateImages(
  items: WXRPost[],
  input: RunMigrationInput,
): Promise<{ imageMap: Map<string, string>; imagesUploaded: number; imagesFailed: number }> {
  const imageMap = new Map<string, string>();
  if (input.skipImages) return { imageMap, imagesUploaded: 0, imagesFailed: 0 };

  const allUrls = new Set<string>();
  for (const item of items) {
    for (const u of extractImageUrls(item.contentEncoded)) allUrls.add(u);
  }
  const urls = [...allUrls];
  if (!urls.length) return { imageMap, imagesUploaded: 0, imagesFailed: 0 };

  let imagesUploaded = 0;
  let imagesFailed = 0;
  const settled = await pAllSettled(
    urls,
    (url) => downloadAndUpload(url, input.client),
    input.imageConcurrency ?? 4,
  );
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (!r) continue;
    if (r.status === 'fulfilled') {
      imageMap.set(r.value.sourceUrl, r.value.assetId);
      imagesUploaded++;
    } else {
      imagesFailed++;
      input.onProgress?.({
        phase: 'warn',
        message: `image failed: ${urls[i]}: ${String(r.reason)}`,
      });
    }
    input.onProgress?.({
      phase: 'images',
      processed: i + 1,
      total: urls.length,
      uploaded: imagesUploaded,
      failed: imagesFailed,
    });
  }
  return { imageMap, imagesUploaded, imagesFailed };
}

async function migratePosts(
  items: WXRPost[],
  data: WXRData,
  client: SanityClient,
  imageMap: Map<string, string>,
  input: RunMigrationInput,
): Promise<number> {
  let posted = 0;
  for (const item of items) {
    await migrateOnePost(item, client, data, imageMap);
    posted++;
    input.onProgress?.({
      phase: 'posts',
      processed: posted,
      total: items.length,
      currentTitle: item.title,
    });
  }
  return posted;
}

async function migrateOnePost(
  item: WXRPost,
  client: SanityClient,
  data: WXRData,
  imageMap: Map<string, string>,
): Promise<void> {
  const body = htmlToPortableText(item.contentEncoded, { imageUrlToAssetId: imageMap });
  const isPage = item.postType === 'page';

  const author = data.authors.find((a) => a.login === item.creator);
  const cats = item.categories
    .filter((c) => c.domain === 'category')
    .map((c) => ({ _type: 'reference', _ref: categoryDocId(c.slug) }));

  const doc: SanityDoc = {
    _id: isPage ? pageDocId(item.id) : postDocId(item.id),
    _type: isPage ? 'page' : 'post',
    title: item.title,
    slug: { _type: 'slug', current: slugify(item.postName || item.title) },
    body,
    wpId: item.id,
  };

  if (!isPage) {
    if (item.excerptEncoded) doc.excerpt = stripHtml(item.excerptEncoded);
    if (author) doc.author = { _type: 'reference', _ref: authorDocId(author.login) };
    if (cats.length) doc.categories = cats;
    doc.publishedAt = new Date(item.postDateGmt ?? item.postDate ?? new Date()).toISOString();
  }

  await client.createOrReplace(doc);
}
