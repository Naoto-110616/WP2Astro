/**
 * Run `fn` over `items` with bounded concurrency. Always resolves with
 * a settled-result array in input order, never throws on individual items.
 */
export async function pAllSettled<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      const item = items[i];
      if (item === undefined) continue;
      try {
        results[i] = { status: 'fulfilled', value: await fn(item, i) };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  };
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
