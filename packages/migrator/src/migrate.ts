import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import pLimit from 'p-limit';
import { type UploadedAsset, downloadAndUpload } from './images.js';
import { parseWXR } from './parser.js';
import { authorDocId, categoryDocId, makeClient, pageDocId, postDocId, slugify } from './sanity.js';
import { extractImageUrls, htmlToPortableText } from './transformer.js';
import type { MigrateOptions, WXRPost } from './types.js';

export async function migrate(options: MigrateOptions): Promise<void> {
  const spinner = ora(`Reading WXR: ${options.input}`).start();
  const data = await parseWXR(options.input);
  spinner.succeed(
    `Parsed: ${data.posts.length} items, ${data.authors.length} authors, ${data.terms.length} terms`,
  );

  const filterType = options.postType ?? 'post';
  const items = data.posts.filter(
    (p) => p.status === 'publish' && (filterType === 'all' ? true : p.postType === filterType),
  );
  console.log(chalk.cyan(`Migrating ${items.length} ${filterType} item(s)…`));

  if (options.dryRun) {
    const outDir = path.resolve('migrator-output');
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, 'parsed.json'), JSON.stringify(data, null, 2), 'utf-8');
    console.log(chalk.green(`Dry run complete. Output: ${outDir}/parsed.json`));
    return;
  }

  if (!options.token) {
    throw new Error('--token is required when not in --dry-run mode');
  }

  const client = makeClient({
    projectId: options.projectId,
    dataset: options.dataset,
    token: options.token,
    apiVersion: options.apiVersion,
  });

  // 1. Authors
  const authorTx = client.transaction();
  for (const a of data.authors) {
    authorTx.createOrReplace({
      _id: authorDocId(a.login),
      _type: 'author',
      name: a.displayName,
      slug: { _type: 'slug', current: slugify(a.login) },
      ...(a.lastName || a.firstName
        ? { bio: [a.firstName, a.lastName].filter(Boolean).join(' ') }
        : {}),
    });
  }
  if (data.authors.length) {
    await authorTx.commit();
    console.log(chalk.green(`✓ Authors: ${data.authors.length}`));
  }

  // 2. Categories
  const cats = data.terms.filter((t) => t.taxonomy === 'category');
  if (cats.length) {
    const catTx = client.transaction();
    for (const c of cats) {
      catTx.createOrReplace({
        _id: categoryDocId(c.slug),
        _type: 'category',
        title: c.name,
        slug: { _type: 'slug', current: slugify(c.slug) },
      });
    }
    await catTx.commit();
    console.log(chalk.green(`✓ Categories: ${cats.length}`));
  }

  // 3. Images (collect from all posts, dedupe, upload)
  const imageMap = new Map<string, string>();
  if (!options.skipImages) {
    const allUrls = new Set<string>();
    for (const item of items) {
      for (const u of extractImageUrls(item.contentEncoded)) allUrls.add(u);
    }
    console.log(chalk.cyan(`Uploading ${allUrls.size} image(s)…`));
    const limit = pLimit(options.concurrency ?? 4);
    const uploads = await Promise.allSettled(
      [...allUrls].map((url) =>
        limit(async (): Promise<UploadedAsset> => downloadAndUpload(url, client)),
      ),
    );
    let ok = 0;
    let fail = 0;
    for (const r of uploads) {
      if (r.status === 'fulfilled') {
        imageMap.set(r.value.sourceUrl, r.value.assetId);
        ok++;
      } else {
        fail++;
        console.warn(chalk.yellow(`  image failed: ${r.reason}`));
      }
    }
    console.log(chalk.green(`✓ Images: ${ok} uploaded, ${fail} failed`));
  }

  // 4. Posts/Pages
  let posted = 0;
  for (const item of items) {
    await migrateOne(item, client, data, imageMap);
    posted++;
    if (posted % 10 === 0) console.log(chalk.gray(`  …${posted}/${items.length}`));
  }

  console.log(chalk.green.bold(`\n✓ Migration complete: ${posted} item(s)`));
}

async function migrateOne(
  item: WXRPost,
  client: ReturnType<typeof makeClient>,
  data: Awaited<ReturnType<typeof parseWXR>>,
  imageMap: Map<string, string>,
) {
  const body = htmlToPortableText(item.contentEncoded, { imageUrlToAssetId: imageMap });
  const isPage = item.postType === 'page';

  const author = data.authors.find((a) => a.login === item.creator);
  const cats = item.categories
    .filter((c) => c.domain === 'category')
    .map((c) => ({ _type: 'reference', _ref: categoryDocId(c.slug) }));

  const doc: Record<string, unknown> = {
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

const stripHtml = (s: string): string =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
