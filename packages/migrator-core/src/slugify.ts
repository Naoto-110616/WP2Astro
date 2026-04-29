export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9぀-ヿ一-鿿\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 96) || 'post';

export const authorDocId = (login: string): string => `author-${slugify(login)}`;
export const categoryDocId = (slug: string): string => `category-${slugify(slug)}`;
export const postDocId = (wpId: number): string => `post-wp-${wpId}`;
export const pageDocId = (wpId: number): string => `page-wp-${wpId}`;
