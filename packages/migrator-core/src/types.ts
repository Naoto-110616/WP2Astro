import type { SanityClient } from '@sanity/client';

export interface WXRAuthor {
  login: string;
  email?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

export interface WXRTerm {
  id: number;
  slug: string;
  name: string;
  taxonomy: 'category' | 'post_tag';
}

export interface WXRPostCategory {
  domain: string;
  slug: string;
  name: string;
}

export interface WXRPost {
  id: number;
  title: string;
  link: string;
  pubDate?: string;
  creator: string;
  guid: string;
  description?: string;
  contentEncoded: string;
  excerptEncoded?: string;
  postDate: string;
  postDateGmt?: string;
  postName: string;
  status: string;
  postType: 'post' | 'page' | string;
  categories: WXRPostCategory[];
  attachmentUrl?: string;
}

export interface WXRData {
  title?: string;
  link?: string;
  description?: string;
  authors: WXRAuthor[];
  terms: WXRTerm[];
  posts: WXRPost[];
}

export type PortableTextLike = Record<string, unknown>;

export interface UploadedAsset {
  sourceUrl: string;
  assetId: string;
  url: string;
}

export type MigrationPhase = 'authors' | 'categories' | 'images' | 'posts' | 'complete';

export type MigrationProgress =
  | { phase: 'parse'; postsCount: number; authorsCount: number; termsCount: number }
  | { phase: 'authors'; processed: number; total: number }
  | { phase: 'categories'; processed: number; total: number }
  | { phase: 'images'; processed: number; total: number; uploaded: number; failed: number }
  | { phase: 'posts'; processed: number; total: number; currentTitle?: string }
  | { phase: 'complete'; postsMigrated: number; imagesUploaded: number; imagesFailed: number }
  | { phase: 'warn'; message: string }
  | { phase: 'error'; message: string };

export interface RunMigrationInput {
  xml: string;
  client: SanityClient;
  postType?: 'post' | 'page' | 'all';
  skipImages?: boolean;
  imageConcurrency?: number;
  onProgress?: (event: MigrationProgress) => void;
}

export interface MigrationResult {
  postsMigrated: number;
  imagesUploaded: number;
  imagesFailed: number;
  authorsCount: number;
  categoriesCount: number;
}
