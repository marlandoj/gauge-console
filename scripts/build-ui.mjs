import { readFile, writeFile } from 'node:fs/promises';

export async function compileUI() {
  const source = await readFile(new URL('../src/app.ts', import.meta.url), 'utf8');
  return new Bun.Transpiler({ loader: 'ts', target: 'browser' }).transform(source);
}

if (import.meta.main) {
  await writeFile(new URL('../public/app.js', import.meta.url), await compileUI());
  console.log('Compiled public/app.js');
}
