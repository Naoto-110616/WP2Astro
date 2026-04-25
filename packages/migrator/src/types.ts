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
  categories: { domain: string; slug: string; name: string }[];
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

export interface MigrateOptions {
  input: string;
  projectId: string;
  dataset: string;
  token: string;
  apiVersion?: string;
  dryRun?: boolean;
  skipImages?: boolean;
  concurrency?: number;
  postType?: 'post' | 'page' | 'all';
}
