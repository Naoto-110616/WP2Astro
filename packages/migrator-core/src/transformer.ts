import { htmlToBlocks } from '@sanity/block-tools';
import { Schema } from '@sanity/schema';
import { JSDOM } from 'jsdom';
import type { PortableTextLike } from './types.js';

const blockContentType = Schema.compile({
  name: 'wp2astro',
  types: [
    {
      type: 'object',
      name: 'post',
      fields: [
        {
          name: 'body',
          type: 'array',
          of: [
            {
              type: 'block',
              styles: [
                { title: 'Normal', value: 'normal' },
                { title: 'H2', value: 'h2' },
                { title: 'H3', value: 'h3' },
                { title: 'H4', value: 'h4' },
                { title: 'Quote', value: 'blockquote' },
              ],
              lists: [
                { title: 'Bullet', value: 'bullet' },
                { title: 'Number', value: 'number' },
              ],
              marks: {
                decorators: [
                  { title: 'Strong', value: 'strong' },
                  { title: 'Em', value: 'em' },
                  { title: 'Code', value: 'code' },
                ],
                annotations: [
                  {
                    name: 'link',
                    type: 'object',
                    fields: [
                      { name: 'href', type: 'url' },
                      { name: 'blank', type: 'boolean' },
                    ],
                  },
                ],
              },
            },
            { type: 'image' },
          ],
        },
      ],
    },
  ],
})
  .get('post')
  .fields.find((f: { name: string }) => f.name === 'body').type;

export interface HtmlToBlocksOptions {
  imageUrlToAssetId?: Map<string, string>;
}

/**
 * Strip Gutenberg block comments and normalize WordPress-flavored HTML so it
 * round-trips well into Portable Text.
 */
export function normalizeWordPressHtml(html: string): string {
  return html
    .replace(/<!--\s*wp:[^>]*-->/g, '')
    .replace(/<!--\s*\/wp:[^>]*-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(?<!<\/(?:p|h[1-6]|li|blockquote|pre|ul|ol)>)\n\n/g, '</p><p>')
    .replace(/^(?!<)/, '<p>')
    .replace(/(?<!>)$/, '</p>');
}

export function htmlToPortableText(
  html: string,
  options: HtmlToBlocksOptions = {},
): PortableTextLike[] {
  if (!html || !html.trim()) return [];

  const normalizedHtml = normalizeWordPressHtml(html);

  const blocks = htmlToBlocks(normalizedHtml, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
    rules: [
      {
        deserialize(el, _next, block) {
          const element = el as Element;
          if (element.tagName?.toLowerCase() !== 'img') return undefined;
          const src = element.getAttribute('src') ?? '';
          const alt = element.getAttribute('alt') ?? '';
          const assetId = options.imageUrlToAssetId?.get(src);
          if (!assetId) {
            return block({
              _type: 'image',
              _sanityAsset: `image@${src}`,
              alt,
            });
          }
          return block({
            _type: 'image',
            asset: { _type: 'reference', _ref: assetId },
            alt,
          });
        },
      },
    ],
  });

  return blocks as unknown as PortableTextLike[];
}

export function extractImageUrls(html: string): string[] {
  if (!html) return [];
  const urls = new Set<string>();
  const dom = new JSDOM(html);
  for (const img of dom.window.document.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    if (src) urls.add(src);
  }
  return [...urls];
}

export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
