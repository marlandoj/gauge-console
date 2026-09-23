import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const manifest = JSON.parse(await readFile(new URL('../provenance.json', import.meta.url), 'utf8'));

export async function compile() {
  if (Bun.version !== manifest.bun_version) throw new Error(`Use Bun ${manifest.bun_version}; found ${Bun.version}`);
  for (const [path, entry] of Object.entries(manifest.files)) {
    const actual = sha256(await readFile(new URL(`../${path}`, import.meta.url)));
    if (actual !== entry.sha256) throw new Error(`Pinned source changed: ${path}`);
  }
  const source = await readFile(new URL('../vendor/gauge/classifier.ts', import.meta.url), 'utf8');
  const code = await new Bun.Transpiler({ loader: 'ts', target: 'browser' }).transform(source);
  const header = `// Gauge ${manifest.classifier_version}; ${manifest.repository}@${manifest.commit}\n// Verbatim TypeScript source SHA-256: ${manifest.files['vendor/gauge/classifier.ts'].sha256}\n// Compiled using Bun ${manifest.bun_version}; see provenance.json and LICENSE.\n`;
  return header + code;
}

if (import.meta.main) {
  const output = await compile();
  await mkdir(new URL('../public/', import.meta.url), { recursive: true });
  await writeFile(new URL('../public/classifier.js', import.meta.url), output);
  console.log(`Compiled public/classifier.js (${sha256(output)})`);
}
