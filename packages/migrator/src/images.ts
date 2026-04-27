import type { SanityClient } from '@sanity/client';
import { lookup as mimeLookup } from 'mime-types';

export interface UploadedAsset {
  sourceUrl: string;
  assetId: string;
  url: string;
}

export async function downloadAndUpload(url: string, client: SanityClient): Promise<UploadedAsset> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = decodeURIComponent(url.split('/').pop() ?? 'image');
  const detectedType = mimeLookup(filename);
  const contentType = res.headers.get('content-type') ?? (detectedType || 'image/jpeg');

  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType,
  });

  return { sourceUrl: url, assetId: asset._id, url: asset.url };
}
