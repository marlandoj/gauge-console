# Browser verification

Run `bun run verify:serve`. Open its loopback URL in Chromium. In browser developer tools, evaluate:

```js
const engine = await import('/classifier.js');
const { cases, metadata } = await (await fetch('/cases.json')).json();
const mismatches = cases.filter(row =>
  JSON.stringify(engine.classify(row.input)) !== JSON.stringify(row.expected)
).map(row => row.id);
const exportsMatch = JSON.stringify({
  tiers: engine.TIERS, harnesses: engine.HARNESSES,
  version: engine.VERSION, mapped: engine.TIERS.map(engine.swarmTier)
}) === JSON.stringify(metadata);
if (mismatches.length || !exportsMatch) throw new Error('Browser equivalence failed');
console.log({ matched: cases.length, mismatches, exportsMatch });
```

The server runs the original TypeScript through Bun and supplies expected results; Chromium loads the exact committed browser JavaScript. The undefined-input test is represented by an omitted `input` JSON property and remains `undefined` when read. No task leaves the loopback server/browser test environment. Browser evidence is recorded separately from Bun-only CI.
