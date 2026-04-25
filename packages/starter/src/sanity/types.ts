import type { PortableTextBlock } from '@portabletext/types';

export type SanityImage = {
  _type: 'image';
  asset: { _ref: string; _type: 'reference' };
  alt?: string;
  hotspot?: { x: number; y: number };
};

export type Author = {
  _id: string;
  name: string;
  slug: string;
  avatar?: SanityImage;
  bio?: string;
};

export type Category = {
  title: string;
  slug: string;
};

export type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  mainImage?: SanityImage;
  body?: PortableTextBlock[];
  seo?: { metaTitle?: string; metaDescription?: string };
  author?: Author;
  categories?: Category[];
};

export type SiteSettings = {
  title?: string;
  description?: string;
  logo?: SanityImage;
  navigation?: { label: string; href: string }[];
  social?: { twitter?: string; github?: string; linkedin?: string };
};

export type Page = {
  _id: string;
  title: string;
  slug: string;
  body?: PortableTextBlock[];
  seo?: { metaTitle?: string; metaDescription?: string };
};
