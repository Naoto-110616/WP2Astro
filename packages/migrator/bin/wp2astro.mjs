#!/usr/bin/env node
import('../src/cli.ts')
  .then(({ run }) => run(process.argv))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
