import { readFile } from 'node:fs/promises';
import { compileUI } from './build-ui.mjs';

const actual = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
if (actual !== await compileUI()) throw new Error('Stale UI artifact: run bun run build and commit public/app.js');
console.log('UI artifact matches its TypeScript source.');
