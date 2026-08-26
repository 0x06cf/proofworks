# Proofworks — a research skill that verifies its own citations

Proofworks is a client-side **research skill** for AI agents. It turns a cited
draft into an annotated draft: for every claim that cites a source, it fetches
the source, checks the claim against it, and says **why** — with a supporting
passage when it's verified, an honest refusal when it isn't.

- **No hosted server, no MCP, no API key, no account.** It runs inside your
  agent, on its own machine and its own model.
- **The product is the skill** — a `SKILL.md` operating procedure plus two small
  helper scripts. This repo is both the source *and* the skill.
- **Honesty is the point.** Verification is a two-pass check. A deterministic
  first pass asks whether the exact quote or number appears in the fetched
  source. Everything else goes to a strict, source-bound judgment pass.

## Quick start

Give any agent this one line (works with Claude Code, Codex, OpenCode, Windsurf,
Cursor, Copilot, or any agent that can fetch a URL):

```
Fetch and execute the setup instructions for the Proofworks skill from @url:https://sentrylab.app/agent-setup/prompt.md
```

The agent clones this repo, reads `skill/proofworks-verifier/SKILL.md`, and
adopts the verify-and-backfill loop.

## What's in the repo

- `skill/proofworks-verifier/` — the product
  - `SKILL.md` — the operating procedure an agent follows
  - `references/loop.md` — the verify-and-backfill loop protocol + JSON schema
  - `scripts/fetch_source.py` — deterministic fetch + strip a URL to text
  - `scripts/presence_match.py` — literal quote/number presence check
  - `tests/test_helpers.py` — regression tests for the helpers
- `src/` — the Cloudflare Worker that serves the landing page and the static
  files an agent needs to find and adopt the skill:
  - `/` — the marketing landing
  - `/agent-setup/prompt.md` — the one-line skill install prompt (the product surface)
  - `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/.well-known/*`, IndexNow keys

## How verification works

```
claim + cited source
  │ 1. fetch (deterministic)          — fetch_source.py
  v
 source text
  │ 2. presence pass (deterministic)  — presence_match.py
  v
 present? ──yes──► verified   (record the matching passage)
  │ no
  v
 3. semantic pass (LLM, source-only): does the source support the claim as written?
  │
 supported? ──yes──► verified
  │ no
  v
 4. backfill: find one extra source for the claim as written
  │
  pass ──► verified (add the extra source) · fail ──► unsupported / exhausted
```

Per claim the skill reports: `verified` (with the matching passage), or
`unsupported` / `exhausted`. If a claim's fact is wrong but no source backs it
(*"The Eiffel Tower is in Miami"*), the claim stays `unsupported` and the skill
**flags a proposed correction** — the user decides. Corrections are never applied
silently.

## Development

The Worker is TypeScript on Cloudflare Workers.

```bash
npm install
npm run typecheck   # tsc --noEmit
npx wrangler dev --local --port 8787   # local dev
npx wrangler deploy                    # production (sentrylab.app)
```

**Caveat for edits to `src/ui.ts` and `src/agent.ts`:** the landing and the
skill content are TypeScript template literals. A single `\n` or an unescaped
backtick inside one becomes a *real* newline / terminates the literal in the
served output — silently breaking the page. Use `\\n` and `` \` `` and verify the
served bytes (`python3` hex dump) plus `node --check` on the extracted inline
script after touching them.

## License

MIT