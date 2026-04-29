import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? import.meta.env.SANITY_STUDIO_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? import.meta.env.SANITY_STUDIO_DATASET ?? 'production';

if (!projectId) {
  throw new Error('Missing Sanity project ID. Set PUBLIC_SANITY_PROJECT_ID in Cloudflare Pages build variables.');
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);
export const urlFor = (source: SanityImageSource) => builder.image(source);
