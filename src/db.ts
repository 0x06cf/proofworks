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

/** Record the human's verdict on a single claim. */
export async function setClaimHumanVerdict(
  env: Env,
  claimId: number,
  humanVerdict: 'confirmed' | 'rejected' | 'flagged',
  verifiedBy?: string
): Promise<void> {
  await env.DB.prepare(
    `UPDATE claims SET human_verdict = ?, verified_at = datetime('now'), verified_by = ?
     WHERE id = ?`
  ).bind(humanVerdict, verifiedBy ?? 'anonymous', claimId).run();
  // touch parent check status
  await env.DB.prepare(
    `UPDATE checks SET updated_at = datetime('now') WHERE id = (SELECT check_id FROM claims WHERE id = ?)`
  ).bind(claimId).run();
}

/** Wrap up a check once all claims are decided. */
export async function finalizeCheck(env: Env, checkId: number, humanVerdict: string): Promise<void> {
  await env.DB.prepare(`UPDATE checks SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(humanVerdict, checkId)
    .run();
}

/** Pull the human-verified corpus for the AI/MCP surface. */
export async function getVerifiedCorpus(env: Env, limit = 50): Promise<any[]> {
  const { results } = await env.DB.prepare(
    `SELECT claim_text, claim_index, verdict, human_verdict, source_url, verified_at,
            source_snippet,
            CASE WHEN human_verdict = 'confirmed' THEN 'supported' ELSE verdict END AS final_verdict
     FROM claims
     WHERE human_verdict IS NOT NULL AND human_verdict != ''
     ORDER BY verified_at DESC
     LIMIT ?`
  ).bind(limit).all();
  return results as any[];
}