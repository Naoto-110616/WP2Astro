import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { sanityClient } from '~/sanity/client';
import { allPostsQuery } from '~/sanity/queries';
import type { Post } from '~/sanity/types';

export async function GET(context: APIContext) {
  const posts = await sanityClient.fetch<Post[]>(allPostsQuery).catch(() => [] as Post[]);

  return rss({
    title: 'WP2Astro',
    description: 'WordPress to Astro + Sanity migration toolkit',
    site: context.site ?? import.meta.env.PUBLIC_SITE_URL,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt),
      description: post.excerpt ?? '',
      link: `/blog/${post.slug}`,
    })),
  });
}
