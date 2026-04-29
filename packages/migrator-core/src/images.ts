import type { SanityClient } from '@sanity/client';
import { lookup as mimeLookup } from 'mime-types';
import type { UploadedAsset } from './types.js';

/**
 * Download an image by URL and upload it as a Sanity asset.
 * Uses the platform `fetch` and `Blob` so it runs in Node 18+, Cloudflare
 * Workers, Deno, Bun and Fly.io machines without modification.
 */
export async function downloadAndUpload(url: string, client: SanityClient): Promise<UploadedAsset> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  const filename = decodeURIComponent(url.split('/').pop() ?? 'image');
  const detectedType = mimeLookup(filename);
  const contentType = res.headers.get('content-type') ?? (detectedType || 'image/jpeg');
  const blob = new Blob([await res.arrayBuffer()], { type: contentType });

  const asset = await client.assets.upload('image', blob, {
    filename,
    contentType,
  });

  return { sourceUrl: url, assetId: asset._id, url: asset.url };
}
