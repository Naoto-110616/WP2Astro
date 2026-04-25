import { type SanityClient, createClient } from '@sanity/client';

export interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
  apiVersion?: string;
}

export function makeClient(config: SanityConfig): SanityClient {
  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    token: config.token,
    apiVersion: config.apiVersion ?? '2025-01-01',
    useCdn: false,
  });
}

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9぀-ヿ一-鿿\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 96) || 'post';

export const authorDocId = (login: string) => `author-${slugify(login)}`;
export const categoryDocId = (slug: string) => `category-${slugify(slug)}`;
export const postDocId = (wpId: number) => `post-wp-${wpId}`;
export const pageDocId = (wpId: number) => `page-wp-${wpId}`;
