import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { type MigrationProgress, parseWXRFromString, runMigration } from '@wp2astro/migrator-core';
import chalk from 'chalk';
import ora from 'ora';

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

export async function migrate(options: MigrateOptions): Promise<void> {
  const spinner = ora(`Reading WXR: ${options.input}`).start();
  const xml = await readFile(options.input, 'utf-8');

  if (options.dryRun) {
    const data = parseWXRFromString(xml);
    spinner.succeed(
      `Parsed: ${data.posts.length} items, ${data.authors.length} authors, ${data.terms.length} terms`,
    );
    const outDir = path.resolve('migrator-output');
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, 'parsed.json'), JSON.stringify(data, null, 2), 'utf-8');
    console.log(chalk.green(`Dry run complete. Output: ${outDir}/parsed.json`));
    return;
  }

  if (!options.token) {
    spinner.fail();
    throw new Error('--token is required when not in --dry-run mode');
  }
  if (!options.projectId) {
    spinner.fail();
    throw new Error('--project-id is required when not in --dry-run mode');
  }

  spinner.text = 'Migrating to Sanity…';

  const client = createClient({
    projectId: options.projectId,
    dataset: options.dataset,
    token: options.token,
    apiVersion: options.apiVersion ?? '2025-01-01',
    useCdn: false,
  });

  try {
    await runMigration({
      xml,
      client,
      postType: options.postType,
      skipImages: options.skipImages,
      imageConcurrency: options.concurrency,
      onProgress: (e) => printProgress(spinner, e),
    });
    spinner.succeed('Migration complete');
  } catch (err) {
    spinner.fail('Migration failed');
    throw err;
  }
}

function printProgress(spinner: ReturnType<typeof ora>, e: MigrationProgress): void {
  switch (e.phase) {
    case 'parse':
      spinner.succeed(
        `Parsed: ${e.postsCount} items, ${e.authorsCount} authors, ${e.termsCount} terms`,
      );
      spinner.start('Running migration…');
      break;
    case 'authors':
      console.log(chalk.green(`✓ Authors: ${e.processed}`));
      break;
    case 'categories':
      console.log(chalk.green(`✓ Categories: ${e.processed}`));
      break;
    case 'images':
      spinner.text = `Uploading images: ${e.processed}/${e.total} (${e.uploaded} ok, ${e.failed} fail)`;
      if (e.processed === e.total) {
        console.log(chalk.green(`✓ Images: ${e.uploaded} uploaded, ${e.failed} failed`));
      }
      break;
    case 'posts':
      spinner.text = `Posts: ${e.processed}/${e.total} — ${e.currentTitle ?? ''}`;
      if (e.processed % 10 === 0 || e.processed === e.total) {
        console.log(chalk.gray(`  …${e.processed}/${e.total}`));
      }
      break;
    case 'complete':
      console.log(
        chalk.green.bold(
          `\n✓ Migration complete: ${e.postsMigrated} post(s), ${e.imagesUploaded} image(s)`,
        ),
      );
      break;
    case 'warn':
      console.warn(chalk.yellow(`  ${e.message}`));
      break;
    case 'error':
      console.error(chalk.red(e.message));
      break;
  }
}
