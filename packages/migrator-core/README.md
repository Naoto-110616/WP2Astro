# @wp2astro/migrator-core

Pure WordPress WXR → Sanity migration primitives. Runtime-agnostic, used by the
[CLI](../migrator) and the SaaS worker.

## What's in here

- `parseWXRFromString(xml)` — WordPress eXtended RSS parser. No filesystem.
- `htmlToPortableText(html, { imageUrlToAssetId })` — WP HTML → Sanity Portable Text.
- `extractImageUrls(html)` — pull every `<img src>` out of a chunk of HTML.
- `slugify(s)`, `authorDocId`, `categoryDocId`, `postDocId`, `pageDocId` — stable Sanity document IDs.
- `downloadAndUpload(url, client)` — fetch an image and upload to Sanity assets (Web `Uint8Array`, runs anywhere).
- `runMigration({ xml, client, onProgress })` — the full orchestration: authors → categories → images → posts.
- `pAllSettled(items, fn, concurrency)` — bounded-concurrency settled runner used internally.

## Why a separate package

The CLI is tied to Node (filesystem, ora/chalk for progress). The SaaS job
worker needs the same logic without those dependencies, and ideally callable
from edge runtimes. Splitting the pure logic here lets both targets reuse it
verbatim and keeps `@wp2astro/migrator` as a thin Node CLI shell.

## Quick example

```ts
import { createClient } from '@sanity/client';
import { runMigration } from '@wp2astro/migrator-core';
import { readFile } from 'node:fs/promises';

const xml = await readFile('./site.xml', 'utf-8');
const client = createClient({
  projectId: 'xxx',
  dataset: 'production',
  token: 'sk...',
  apiVersion: '2025-01-01',
  useCdn: false,
});

const result = await runMigration({
  xml,
  client,
  onProgress: (e) => console.log(e),
});

console.log(result);
// { postsMigrated: 42, imagesUploaded: 18, imagesFailed: 0, authorsCount: 1, categoriesCount: 5 }
```

## License

MIT
