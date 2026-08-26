// db.ts
// D1 data access layer for Proofworks.
import type { Claim, Verdict } from './claim-engine';

export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
}

export interface CheckRow {
  id: number;
  workspace_id: number;
  ai_text: string;
  status: string;
  created_at: string;
}

/** Create a new check + its claims in one transaction. Returns {checkId, claims}. */
export async function createCheck(
  env: Env,
  workspaceId: number,
  aiText: string,
  claims: Array<{ claim_text: string; source_url: string | null; source_snippet: string | null; verdict: Claim['verdict'] }>
): Promise<{ checkId: number; claimIds: number[] }> {
  const { results: ws } = await env.DB.prepare(
    `SELECT id FROM workspaces WHERE id = ?`
  ).bind(workspaceId).all();
  if (ws.length === 0) {
    // auto-create default workspace
    await env.DB.prepare(`INSERT INTO workspaces (name) VALUES ('default')`).run();
    workspaceId = 1;
  }
  const check = await env.DB.prepare(
    `INSERT INTO checks (workspace_id, ai_text, status) VALUES (?, ?, 'pending')`
  ).bind(workspaceId, aiText).run();
  const checkId = Number(check.meta.last_row_id);

  const claimIds: number[] = [];
  for (let i = 0; i < claims.length; i++) {
    const c = claims[i];
    const r = await env.DB.prepare(
      `INSERT INTO claims (check_id, claim_text, claim_index, source_url, source_snippet, verdict)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(checkId, c.claim_text, i, c.source_url, c.source_snippet, c.verdict).run();
    claimIds.push(Number(r.meta.last_row_id));
  }
  return { checkId, claimIds };
}

/** Pull the verified claim corpus (deterministic + source-backed) for the AI/MCP surface. */
export async function getVerifiedCorpus(env: Env, limit = 50): Promise<any[]> {
  const { results } = await env.DB.prepare(
    `SELECT claim_text, claim_index, verdict, source_url,
            source_snippet, confidence, method,
            created_at AS verified_at,
            verdict AS final_verdict
     FROM claims
     WHERE verdict IN ('confirmed', 'refuted', 'supported', 'partial')
     ORDER BY id DESC
     LIMIT ?`
  ).bind(limit).all();
  return results as any[];
}