# Gauge Console

A one-screen browser console for understanding Gauge's deterministic task-complexity assessment. Built for Hackyard Yard #3 by Marlandoj.

**Current milestone: working one-screen interface.** Enter a task or try an example to see its tier, exact fired reason codes and plain-language explanations. The dial supports all five tiers and abstention. The seven-harness selector shows metadata and resolver mapping only. Receipt ledger, cohort replay and deployment are subsequent milestones; no live demo is deployed yet.

## Try locally

```sh
bun install --frozen-lockfile
bun run check
bun run dev
```

Open the loopback URL printed by `dev`. It serves the committed `public/` directory at both `/` and `/gauge-console/` to exercise GitHub Pages subpath compatibility. It has no classification API. The page imports its pinned engine locally, with no external fonts, scripts, analytics or task uploads. Stop the development server with Ctrl-C.

Edit `src/app.ts`, then run `bun run build`. CI rejects a stale `public/app.js` and checks the original classifier snapshot separately. CSS and HTML live directly in `public/`.

## Verify

Use Bun **1.3.12**:

```sh
bun install --frozen-lockfile
bun run check
```

The gate compares the committed browser module with the pinned original TypeScript run by Bun across **60 development tasks, 20 original held-out tasks, and 32 adversarial inputs**. It checks complete assessment objects, export parity, tier mapping, source hashes and byte-for-byte reproducible compilation. A mismatch exits nonzero. It never regenerates the artifact before testing it.

```sh
bun run build
bun scripts/verify.mjs --write-report
bun run verify:serve
```

`build` intentionally regenerates `public/classifier.js`. `verify:serve` starts an ephemeral loopback-only verification server for a real-browser check; it is development tooling, not a product backend. Stop it with Ctrl-C. See [browser verification](docs/browser-verification.md).

## Source and boundaries

The TypeScript in `vendor/gauge/classifier.ts` is copied **verbatim** from Gauge commit `49b2aa5cc4abd11c98ce35b0b6fd9d2ee9c66621`. [provenance.json](provenance.json) records exact paths, hashes and compiler version. The generated ESM file has a provenance header. The app imports this exact module; it needs no API, provider key, resolver, or server for classification.

`classify(unknown)` returns `{ tier, reasons, abstained }`. Tiers are trivial, simple, moderate, complex and apex; `swarmTier()` maps apex to complex. Seven harness IDs are exported as metadata. This scaffold does not invoke harnesses, choose models or change production routing.

The Gauge owner authorized publishing this classifier and its synthetic fixtures as part of Gauge Console. This snapshot is released under MIT here; the parent Gauge repository stays private. No operational receipts, private prompts or credentials are included. Authorized maintainers can run `bun run verify:upstream` using authenticated GitHub CLI access to compare every pinned file directly with upstream; public CI runs offline from the hashed snapshot.

## Evidence is not accuracy

[evidence/equivalence.json](evidence/equivalence.json) records port equivalence and separately measured label agreement. A 100% match means the port preserves Gauge's behavior; it does not mean its predictions are always correct. The 80 original synthetic cases are historical material and are not a fresh unseen evaluation for v0.3.0. Gauge remains experimental and shadow-only.

## Build-week provenance

Upstream history first records this classifier on September 23, 2026 at 8:39 AM Arizona; v0.3.0's classifier change is recorded at 10:41 AM Arizona that day. Both fall inside Yard #3's September 21–25 build window. Commit timestamps show recorded history, not independent proof of when every line was originally authored. Repository creation alone is insufficient to establish eligibility. The new console source is authored during the build window.

## One-screen experience

Task input, tier dial, reason codes and harness metadata share one view with no routed pages. Assessment is debounced by 220 ms; the button and Ctrl/⌘+Enter assess immediately. Input over 100,000 characters is retained with an inline correction message. Keyboard focus, reduced motion, composition input and narrow-screen reflow are supported. The browser checks are documented in [UI verification](docs/ui-verification.md).

Synthetic cohort replay and browser-local digest receipts will be added in later milestones, followed by GitHub Pages deployment and the required demo video.
