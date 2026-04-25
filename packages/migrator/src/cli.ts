import chalk from 'chalk';
import { Command } from 'commander';
import { migrate } from './migrate.js';

export async function run(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name('wp2astro')
    .description('Migrate WordPress WXR exports into a Sanity dataset.')
    .version('0.1.0');

  program
    .command('migrate')
    .description('Run a full WXR -> Sanity migration')
    .requiredOption('-i, --input <path>', 'WXR XML file path')
    .option('-p, --project-id <id>', 'Sanity project ID', process.env.SANITY_PROJECT_ID)
    .option('-d, --dataset <name>', 'Sanity dataset', process.env.SANITY_DATASET ?? 'production')
    .option('-t, --token <token>', 'Sanity API token (write access)', process.env.SANITY_TOKEN)
    .option('--api-version <version>', 'Sanity API version', '2025-01-01')
    .option('--post-type <type>', 'post | page | all', 'post')
    .option('--skip-images', 'Skip image upload', false)
    .option('--concurrency <n>', 'Image upload concurrency', (v) => Number.parseInt(v, 10), 4)
    .option('--dry-run', 'Parse only and write JSON output (no Sanity writes)', false)
    .action(async (opts) => {
      try {
        if (!opts.dryRun) {
          if (!opts.projectId) throw new Error('--project-id is required');
          if (!opts.token) throw new Error('--token is required (or SANITY_TOKEN env)');
        }
        await migrate({
          input: opts.input,
          projectId: opts.projectId ?? '',
          dataset: opts.dataset,
          token: opts.token ?? '',
          apiVersion: opts.apiVersion,
          postType: opts.postType,
          skipImages: opts.skipImages,
          concurrency: opts.concurrency,
          dryRun: opts.dryRun,
        });
      } catch (err) {
        console.error(chalk.red(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}
