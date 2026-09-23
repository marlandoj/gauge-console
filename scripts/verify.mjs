import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import * as original from '../vendor/gauge/classifier.ts';
import * as browser from '../public/classifier.js';
import { adversarial } from '../tests/adversarial.mjs';
import { compile, sha256, manifest } from './build.mjs';

export async function verify() {
  const artifact = await readFile(new URL('../public/classifier.js', import.meta.url), 'utf8');
  assert.equal(artifact, await compile(), 'Committed browser artifact must match a fresh compile');
  assert.deepEqual(Object.keys(browser).sort(), Object.keys(original).sort(), 'Exports differ');
  assert.equal(browser.VERSION, manifest.classifier_version);
  assert.deepEqual(browser.TIERS, original.TIERS);
  assert.deepEqual(browser.HARNESSES, original.HARNESSES);
  for (const tier of original.TIERS) assert.equal(browser.swarmTier(tier), original.swarmTier(tier));
  const cases = [];
  const accuracy = {};
  const ids = new Set();
  const groups = {};
  for (const [name, count] of [['development', 60], ['heldout', 20]]) {
    const rows = (await readFile(new URL(`../tests/fixtures/${name}.jsonl`, import.meta.url), 'utf8')).trim().split('\n').map(row => JSON.parse(row));
    assert.equal(rows.length, count, `${name} cohort count`);
    groups[name] = new Set();
    let correct = 0;
    for (const row of rows) {
      assert.equal(typeof row.task_text, 'string');
      assert.ok(original.TIERS.includes(row.tier));
      assert.equal(row.provenance.kind, 'fresh_synthetic');
      assert.ok(!ids.has(row.id), `Duplicate ${row.id}`);
      ids.add(row.id);
      groups[name].add(row.group_id);
      const expected = original.classify(row.task_text);
      correct += Number(expected.tier === row.tier);
      cases.push({ id: row.id, input: row.task_text, expected });
    }
    accuracy[name] = { correct, total: count, percent: 100 * correct / count };
  }
  assert.equal([...groups.development].filter(group => groups.heldout.has(group)).length, 0, 'Cohort group overlap');
  for (const row of adversarial) cases.push({ ...row, expected: original.classify(row.input) });
  for (const row of cases) assert.deepEqual(browser.classify(row.input), row.expected, row.id);
  const report = {
    status: 'pass', source_commit: manifest.commit, classifier_version: original.VERSION,
    artifact_sha256: sha256(artifact), cohort_cases: 80, adversarial_cases: adversarial.length,
    matched: cases.length, mismatches: 0, equivalence_percent: 100,
    observed_label_accuracy: accuracy,
    note: 'Port equivalence is not predictive accuracy. The original held-out set is historical diagnostic material, not an unseen v0.3.0 test.'
  };
  return { cases, report, metadata: { tiers: original.TIERS, harnesses: original.HARNESSES, version: original.VERSION, mapped: original.TIERS.map(original.swarmTier) } };
}

if (import.meta.main) {
  const { report } = await verify();
  if (process.argv.includes('--write-report')) {
    await mkdir(new URL('../evidence/', import.meta.url), { recursive: true });
    await writeFile(new URL('../evidence/equivalence.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
}
