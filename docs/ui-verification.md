# UI verification

Run `bun run dev`, then open the printed `/gauge-console/` URL with Playwright CLI.
The same site is available at `/`. A fresh browser context avoids unrelated storage.

```sh
playwright-cli -s=gauge open <printed-url>
playwright-cli -s=gauge run-code --filename tests/browser-ui.js
playwright-cli -s=gauge close
```

The 40 browser checks exercise examples, all tiers, abstention, seven harness mappings,
live input, keyboard assessment, rapid changes, inert HTML input, over-limit recovery,
composition input, reduced motion, absence of task network requests/storage, inline
help and five viewport widths (320, 390, 768, 1024, 1440). They require no model or key.
Run from the repository root so the test file resolves. On Zo use the managed
Playwright CLI wrapper, which runs Chromium as the browser-runner account.

`bun run check` separately runs strict TypeScript, all 112 classifier equivalence
cases and a byte-for-byte UI compilation freshness check. Browser checks require an
actual browser and are not included in the existing offline CI job.
