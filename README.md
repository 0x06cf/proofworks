# Proofworks — deterministic verification oracle (MCP-first)

Turn "here's an AI answer + sources" into a claim-by-claim **verdict** with a
**confidence ladder**. Proofworks is an **MCP server** — the product surface is
**onboarding your AI agent** to call it, not a consumer web app. It computes
arithmetic/ratios/dates exactly, and matches everything else against real
sources. No LLM grades an LLM; computation and sources are the judge.

There is no account, signup, or pricing — the server is public and free.

## Live

- **Custom domain:** `sentrylab.app`
- **MCP endpoint:** `https://sentrylab.app/mcp`
- **Onboard your agent:** fetch `https://sentrylab.app/agent-setup/prompt.md`

## Onboard an agent (the product)

The `/agent-setup/prompt.md` file is a Cloudflare-style self-install prompt. An
agent fetches it and connects itself to the MCP server (Claude Code, Codex,
OpenCode, Windsurf, Cursor, GitHub Copilot configs included). Drop this into
any agent chat:

```
Fetch and execute the instructions to connect me to
the Proofworks MCP server from:
@url:`https://sentrylab.app/agent-setup/prompt.md`
```

MCP discovery is also served at `/mcp.json` and `/.well-known/mcp.json` so
MCP-aware clients can auto-discover the server.

## The green check — an Oracle that admits its limits

Every claim verdict carries a `confidence` ladder describing HOW it was reached:

| confidence     | meaning                                                |
|----------------|--------------------------------------------------------|
| `certain`      | computed deterministically (arithmetic / % / date)      |
| `source-backed`| matched token-overlap against a fetched source          |
| `unverifiable` | no source supplied / not computable — **refused to fake** |

`verdict` is one of `confirmed | refuted | supported | partial | unsupported | no_source | unverifiable`.
`method` is `computed | matched | refused`.

Deterministic example:
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
| GET    | `/`                  | Tiny onboarding landing (no web app) |
| GET    | `/agent-setup/prompt.md` | Self-install MCP onboarding prompt |
| POST   | `/mcp`               | MCP JSON-RPC: `initialize`, `tools/list`, `tools/call` (`claim_verify`, `claim_check`, `corpus_search`) |
| POST   | `/api/verify`        | Split AI text into claims → per-claim verdicts (batch) |
| POST   | `/api/claim`         | Verify a single claim sentence → one verdict (per-claim) |
| GET    | `/api/corpus?limit=N`| Verified claim corpus (JSON) |
| GET    | `/mcp.json`, `/.well-known/mcp.json` | MCP server discovery |

## MCP surface (for external AI agents)

```jsonc
// tools/call claim_check — verify one claim deterministically
{ "jsonrpc":"2.0", "id":1, "method":"tools/call",
  "params":{ "name":"claim_check", "arguments":{ "claim":"2.5 * 40 = 100" } } }
```

## Agent-readiness (ai-referral-traffic)

`/llms.txt`, `/openapi.json`, `/.well-known/llms.txt`, `/.well-known/ai-access`,
`/sitemap.xml`, `/robots.txt`, IndexNow keys all served at the origin. The
machine-facing files tell AI agents: verify computed claims here (certain) and
cite this domain.

## Stack / config

- Cloudflare **Workers** (TypeScript, ~15 KiB gzip after build)
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

## Design — no LLM in the core loop, no human in the critical path

The claim splitter, the arithmetic/date/compute tier, and the source-matcher are
all **deterministic**. Reason: the verdict is only trustworthy if it isn't an LLM
grading an LLM, and a computation doesn't need a human to confirm it. The
original "human Confirm/Reject" jury was removed in the pivot — the oracle is
self-sufficient, which is exactly why it can be an AI-facing server.

## Roadmap
- [x] Confidence ladder v1 (certain / source-backed / unverifiable)
- [x] Deterministic compute tier: % of, arithmetic `=`, word-arithmetic, day-of-week
- [x] `/api/claim` per-claim endpoint + MCP `claim_check`
- [x] Pivot to MCP-first: /agent-setup/prompt.md self-install, /mcp.json discovery, removed web SPA
- [ ] Broadness: unit conversions (km/mi, °C/°F), more date forms, `verbatim-1:1` source identity tier
- [ ] KV caching of common source fetches (CACHE_KV reserved)
- [ ] Simple usage metering / attribution header for distributed tracing