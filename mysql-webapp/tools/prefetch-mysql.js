#!/usr/bin/env node
/**
 * Warms the mysql-memory-server binary cache by booting MySQL once and
 * stopping it immediately. Run this during the build so the first real
 * cold start at runtime does not pay the multi-hundred-MB CDN download.
 *
 * Note: the cache lives in the OS temp dir and is not relocatable, so this
 * only helps if the build and runtime share that temp dir (verify on your
 * host). It is always safe to run.
 */

const { createDB } = require('mysql-memory-server');

(async () => {
  const version = process.env.MYSQL_VERSION || '8.4.x';
  console.log(`[prefetch-mysql] ensuring MySQL ${version} binary is cached…`);
  const started = Date.now();
  const db = await createDB({ version, xEnabled: 'OFF' });
  console.log(
    `[prefetch-mysql] MySQL booted on port ${db.port} in ${Date.now() - started}ms; stopping.`,
  );
  await db.stop();
  console.log('[prefetch-mysql] done.');
})().catch((err) => {
  console.error('[prefetch-mysql] failed:', err);
  process.exit(1);
});
