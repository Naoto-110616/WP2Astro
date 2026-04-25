import { defineField, defineType } from 'sanity';

export const category = defineType({
  name: 'category',
  title: 'カテゴリ',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '名称', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({ name: 'description', title: '説明', type: 'text', rows: 2 }),
  ],
});
