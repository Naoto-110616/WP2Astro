import { defineArrayMember, defineType } from 'sanity';

export const blockContent = defineType({
  name: 'blockContent',
  title: '本文ブロック',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: '通常', value: 'normal' },
        { title: '見出し2', value: 'h2' },
        { title: '見出し3', value: 'h3' },
        { title: '見出し4', value: 'h4' },
        { title: '引用', value: 'blockquote' },
      ],
      lists: [
        { title: '箇条書き', value: 'bullet' },
        { title: '番号付き', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: '強調', value: 'strong' },
          { title: '斜体', value: 'em' },
          { title: 'コード', value: 'code' },
          { title: '取り消し線', value: 'strike-through' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'リンク',
            fields: [
              { name: 'href', type: 'url', title: 'URL' },
              { name: 'blank', type: 'boolean', title: '新しいタブで開く' },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: '代替テキスト' }],
    }),
    defineArrayMember({
      type: 'object',
      name: 'codeBlock',
      title: 'コードブロック',
      fields: [
        { name: 'language', type: 'string', title: '言語' },
        { name: 'code', type: 'text', title: 'コード' },
      ],
    }),
  ],
});
