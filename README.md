# Proofworks — human-verified AI claim checker

Turn "here's an AI answer + sources" into a claim-by-claim **trust verdict** with a
human **Confirm / Reject** step. The record of human taps becomes a verified corpus
that **external AI agents can query over MCP / JSON API** — AI uses Proofworks as a
service; AI is *not* built in.

## Live

- **Web app:** https://proofworks.0x06cf.workers.dev
- **Custom domain:** `sentrylab.app` (pending — apex has a legacy DNS record that blocks the Workers custom-domain bind; remove it in Cloudflare → DNS, then `npx wrangler deploy`)

## Endpoints

| Method | Path                 | Purpose |
|--------|----------------------|---------|
| GET    | `/`                  | Human web app (paste → claims → Confirm/Reject) |
| POST   | `/api/verify`        | Split AI text into claims, match against sources, store pending check |
| POST   | `/api/claim/:id`     | Record a human verdict: `{"verdict":"confirmed\|rejected\|flagged"}` |
| GET    | `/api/corpus?limit=N`| Human-verified claim corpus (JSON) |
| POST   | `/mcp`               | MCP JSON-RPC: `initialize`, `tools/list`, `tools/call` (`claim_verify`, `corpus_search`) |

## MCP surface (for external AI agents)

```jsonc
// tools/call corpus_search
{ "jsonrpc":"2.0", "id":1, "method":"tools/call",
  "params":{ "name":"corpus_search", "arguments":{ "limit":10 } } }
```

## Stack / config

- Cloudflare **Workers** (TypeScript, `<1` KiB gzip after build ~10 KiB)
- **D1** `proofworks-db` (workspaces / checks / claims), migrated via `migrations/0001_init.sql`
- **KV** `CACHE_KV` (reserved for future caching)
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

The claim splitter and source-matcher are **deterministic** (token-overlap
similarity, bounded fetch). Reason: the verdict is only trustworthy if it isn't an LLM
grading an LLM. The *human* Confirm/Reject is the ground-truth layer; the
`final_verdict` for the corpus = `supported` when a human confirmed, else the
auto-verdict. Add an LLM later only to improve claim *extraction*, never the verdict.

## Roadmap
- [ ] Remove apex DNS conflict → bind `sentrylab.app`
- [ ] Real auth + per-user workspaces (currently single anonymous workspace)
- [ ] Use KV to cache common source fetches (CACHE_KV reserved)
- [ ] MCP `claim_verify` write path already exists; add a richer `claim_check` that returns per-claim verdicts