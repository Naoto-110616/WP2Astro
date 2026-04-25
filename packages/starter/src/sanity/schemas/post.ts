import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'ブログ記事',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'タイトル',
      type: 'string',
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'excerpt', title: '抜粋', type: 'text', rows: 3 }),
    defineField({
      name: 'mainImage',
      title: 'アイキャッチ画像',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: '代替テキスト' }],
    }),
    defineField({
      name: 'author',
      title: '著者',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'categories',
      title: 'カテゴリ',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'publishedAt',
      title: '公開日',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'body', title: '本文', type: 'blockContent' }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', type: 'string', title: 'meta title' },
        { name: 'metaDescription', type: 'text', title: 'meta description', rows: 3 },
      ],
    }),
    defineField({
      name: 'wpId',
      title: 'WordPress ID（移行用）',
      type: 'number',
      readOnly: true,
      hidden: true,
    }),
  ],
  orderings: [
    {
      title: '公開日（新しい順）',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', media: 'mainImage', author: 'author.name' },
    prepare({ title, media, author }) {
      return { title, media, subtitle: author ? `by ${author}` : '' };
    },
  },
});
