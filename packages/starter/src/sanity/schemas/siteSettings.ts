import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'サイト設定',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'サイトタイトル', type: 'string' }),
    defineField({ name: 'description', title: 'サイト説明', type: 'text', rows: 3 }),
    defineField({
      name: 'logo',
      title: 'ロゴ',
      type: 'image',
    }),
    defineField({
      name: 'navigation',
      title: 'メニュー',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: '表示名' },
            { name: 'href', type: 'string', title: 'リンク先' },
          ],
        },
      ],
    }),
    defineField({
      name: 'social',
      title: 'SNS',
      type: 'object',
      fields: [
        { name: 'twitter', type: 'url' },
        { name: 'github', type: 'url' },
        { name: 'linkedin', type: 'url' },
      ],
    }),
  ],
});
