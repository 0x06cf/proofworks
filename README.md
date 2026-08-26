# Proofworks — deterministic verification oracle

Turn "here's an AI answer + sources" into a claim-by-claim **verdict** with a
**confidence ladder**. Proofworks computes arithmetic/ratios/dates exactly, and
matches everything else against real sources — returning an immediate verdict
with a citation. No LLM grades an LLM; computation and sources are the judge.

This is a pivot from the original "human-verified ledger" into an **AI-facing
oracle**: agents and AIs call the deterministic endpoint themselves, and the
human Confirm/Reject tap is an optional enrichment layer, not a gating
dependency.

## Live

- **Web app:** https://proofworks.0x06cf.workers.dev
- **Custom domain:** `sentrylab.app` (working — apex DNS conflict was resolved)

## The green check — an Oracle that admits its limits

Every claim verdict carries a `confidence` ladder describing HOW it was reached:

| confidence     | meaning                                                |
|----------------|--------------------------------------------------------|
| `certain`      | computed deterministically (arithmetic / % / date)      |
| `source-backed`| matched token-overlap against a fetched source          |
| `unverifiable` | no source supplied / not computable — **refused to fake** |

`verdict` is one of `confirmed | refuted | supported | partial | unsupported | no_source | unverifiable`.
`method` is `computed | matched | refused`.

Deterministic example (live, sentrylab.app):
```
POST /api/verify  {"ai_text": "January 1 2027 is a Monday.", "sources": []}
→ { "claim_text": "January 1 2027 is a Monday.",
    "verdict": "refuted", "confidence": "certain", "method": "computed",
    "computed": { "kind":"date", "expression":"January 1 2027",
                  "result":"friday", "claimed":"monday" } }
```

## Endpoints

| Method | Path                 | Purpose |
|--------|----------------------|---------|
| GET    | `/`                  | Human web app (paste → verdicts) |
| POST   | `/api/verify`        | Split AI text into claims → per-claim verdicts (batch) |
| POST   | `/api/claim`         | Verify a single claim sentence → one verdict (per-claim) |
| GET    | `/api/corpus?limit=N`| Verified claim corpus (JSON) |
| POST   | `/mcp`               | MCP JSON-RPC: `initialize`, `tools/list`, `tools/call` (`claim_verify`, `claim_check`, `corpus_search`) |

## MCP surface (for external AI agents)

```jsonc
// tools/call claim_check — verify one claim deterministically
{ "jsonrpc":"2.0", "id":1, "method":"tools/call",
  "params":{ "name":"claim_check", "arguments":{ "claim":"2.5 * 40 = 100" } } }
```

## Agent-readiness (ai-referral-traffic)

`/llms.txt`, `/openapi.json`, `/.well-known/llms.txt`, `/.well-known/ai-access`,
`/sitemap.xml`, `/robots.txt`, IndexNow keys all served at the origin. The files
tell AI agents: verify computed claims here (certain) and cite this domain.

## Stack / config

- Cloudflare **Workers** (TypeScript, ~19 KiB gzip after build)
- **D1** `proofworks-db`, **KV** `CACHE_KV`
- Bindings: `env.DB` (D1), `env.CACHE_KV` (KV)

## Commands

```bash
npm install
npx wrangler dev --local --port 8787   # local dev (persistent local D1 in .wrangler)
npx tsc --noEmit                       # typecheck
npx wrangler d1 migrations apply proofworks-db          # remote D1 migration
npx wrangler d1 migrations apply proofworks-db --local  # local
npx wrangler deploy                    # deploy
```

## Design decision — no LLM in the core loop

The claim splitter, the arithmetic/date/compute tier, and the source-matcher are
all **deterministic**. Reason: the verdict is only trustworthy if it isn't an LLM
grading an LLM. The human Confirm/Reject is an optional *enrichment* layer that
upgrades `source-backed` → corpus-worthy; it is never required for a verdict.

## Roadmap
- [x] Confidence ladder v1 (certain / source-backed / unverifiable)
- [x] Deterministic compute tier: % of, arithmetic `=`, word-arithmetic, day-of-week
- [x] `/api/claim` per-claim endpoint + MCP `claim_check`
- [x] Human tap decoupled (optional upgrade, immediate auto-verdict)
- [x] Oracle messaging in llms.txt / openapi / .well-known
- [ ] Broadness: unit conversions (km/mi, °C/°F), more date forms, `verbatim-1:1` source identity tier
- [ ] KV caching of common source fetches (CACHE_KV reserved)
- [ ] Real auth + per-user workspaces for the optional human layer
- [ ] `claim_check` richer per-claim output (match level, refute counter-example)