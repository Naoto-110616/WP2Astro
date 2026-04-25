import { readFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import type { WXRAuthor, WXRData, WXRPost, WXRTerm } from './types.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  parseTagValue: false,
  trimValues: true,
});

const asArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const text = (node: unknown): string => {
  if (node === undefined || node === null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object' && node !== null) {
    const o = node as Record<string, unknown>;
    if (typeof o.__cdata === 'string') return o.__cdata;
    if (typeof o['#text'] === 'string') return o['#text'];
  }
  return String(node);
};

export async function parseWXR(filePath: string): Promise<WXRData> {
  const xml = await readFile(filePath, 'utf-8');
  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error('Invalid WXR file: no <channel> element found.');
  }

  const authors: WXRAuthor[] = asArray<Record<string, unknown>>(channel['wp:author']).map((a) => ({
    login: text(a['wp:author_login']),
    email: text(a['wp:author_email']) || undefined,
    displayName: text(a['wp:author_display_name']) || text(a['wp:author_login']),
    firstName: text(a['wp:author_first_name']) || undefined,
    lastName: text(a['wp:author_last_name']) || undefined,
  }));

  const terms: WXRTerm[] = [
    ...asArray<Record<string, unknown>>(channel['wp:category']).map((c) => ({
      id: Number(text(c['wp:term_id'])) || 0,
      slug: text(c['wp:category_nicename']),
      name: text(c['wp:cat_name']),
      taxonomy: 'category' as const,
    })),
    ...asArray<Record<string, unknown>>(channel['wp:tag']).map((t) => ({
      id: Number(text(t['wp:term_id'])) || 0,
      slug: text(t['wp:tag_slug']),
      name: text(t['wp:tag_name']),
      taxonomy: 'post_tag' as const,
    })),
  ];

  const posts: WXRPost[] = asArray<Record<string, unknown>>(channel.item).map((item) => {
    const cats = asArray<Record<string, unknown>>(item.category).map((c) => ({
      domain: String(c['@_domain'] ?? ''),
      slug: String(c['@_nicename'] ?? ''),
      name: text(c),
    }));

    return {
      id: Number(text(item['wp:post_id'])) || 0,
      title: text(item.title),
      link: text(item.link),
      pubDate: text(item.pubDate) || undefined,
      creator: text(item['dc:creator']),
      guid: text(item.guid),
      description: text(item.description) || undefined,
      contentEncoded: text(item['content:encoded']),
      excerptEncoded: text(item['excerpt:encoded']) || undefined,
      postDate: text(item['wp:post_date']),
      postDateGmt: text(item['wp:post_date_gmt']) || undefined,
      postName: text(item['wp:post_name']),
      status: text(item['wp:status']),
      postType: text(item['wp:post_type']) as WXRPost['postType'],
      categories: cats,
      attachmentUrl: text(item['wp:attachment_url']) || undefined,
    };
  });

  return {
    title: text(channel.title) || undefined,
    link: text(channel.link) || undefined,
    description: text(channel.description) || undefined,
    authors,
    terms,
    posts,
  };
}
