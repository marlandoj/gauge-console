import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import { manifest, sha256 } from './build.mjs';

for (const [local, entry] of Object.entries(manifest.files)) {
  const response = spawnSync('gh', ['api', `repos/marlandoj/gauge/contents/${entry.upstream_path}?ref=${manifest.commit}`, '-H', 'Accept: application/vnd.github.raw+json']);
  if (response.status !== 0) throw new Error(`Cannot read pinned upstream ${entry.upstream_path}; requires Gauge repository access`);
  assert.equal(sha256(response.stdout), entry.sha256, `Upstream hash: ${local}`);
  assert.deepEqual(response.stdout, await readFile(new URL(`../${local}`, import.meta.url)));
  console.log(`Exact upstream match: ${local}`);
}
