import { defineField, defineType } from 'sanity';

export const author = defineType({
  name: 'author',
  title: '著者',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: '名前', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'avatar',
      title: 'アバター画像',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'bio', title: 'プロフィール', type: 'text', rows: 4 }),
  ],
});
