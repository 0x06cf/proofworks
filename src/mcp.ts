// mcp.ts
// Public API + MCP-style JSON-RPC surface. External AI agents can query the
// human-verified corpus and submit checks. No LLM here — this is the read/write
// bridge so an agent can USE Proofworks as a service.

import type { Env } from './db';
import { getVerifiedCorpus, createCheck } from './db';
import { extractClaims, matchClaims } from './claim-engine';

const ALLOWED_ORIGINS = ['*']; // tighten to your app domain later.

function cors(res: Response): Response {
  const h = new Headers(res.headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(res.body, { status: res.status, headers: h });
}

export async function handleApi(req: Request, env: Env, url: URL): Promise<Response> {
  if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

  // --- MCP-compatible JSON-RPC over HTTP POST (minimal single-method subset of tools/list + tools/call) ---
  if (url.pathname === '/mcp' && req.method === 'POST') {
    return cors(await handleMcpRequest(req, env));
  }

  // --- Quiet JSON REST API for agents ---
  switch (url.pathname) {
    case '/api/corpus': {
      const limit = Number(url.searchParams.get('limit')) || 50;
      const rows = await getVerifiedCorpus(env, limit);
      return cors(json(rows));
    }
    case '/api/claim': {
      // Per-claim verify: POST { claim, sources? } -> single immediate verdict.
      if (req.method !== 'POST') return cors(json({ error: 'POST only' }, 405));
      const body: any = await req.json().catch(() => null);
      if (!body || typeof body.claim !== 'string' || !body.claim.trim()) {
        return cors(json({ error: 'claim required' }, 400));
      }
      const sources = Array.isArray(body.sources) ? body.sources.map(String) : [];
      const [claim] = await matchClaims([body.claim.trim()], sources);
      return cors(json({ ...claim, id: null }));
    }
    case '/api/verify': {
      if (req.method !== 'POST') return cors(json({ error: 'POST only' }, 405));
      const body: any = await req.json().catch(() => null);
      if (!body || typeof body.ai_text !== 'string') return cors(json({ error: 'ai_text required' }, 400));
      return cors(await runVerify(env, body));
    }
    default:
      return cors(new Response('Not found', { status: 404 }));
  }
}

// Small helper so json(body) returns a Response.
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function runVerify(env: Env, body: any) {
  const aiText = String(body?.ai_text ?? '');
  const sources = Array.isArray(body?.sources) ? body.sources.map(String) : [];
  const claimTexts = extractClaims(aiText);
  const claims = await matchClaims(claimTexts, sources);
  const { checkId, claimIds } = await createCheck(env, 1, aiText, claims);
  const withIds = claims.map((c, i) => ({ ...c, id: claimIds[i] }));
  return json({ checkId, claims: withIds });
}

/** Minimal MCP tool methods: proofworks.claim_verify, proofworks.listCorpus. */
async function handleMcpRequest(req: Request, env: Env): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } });

  const { method, params = {}, id } = body as any;

  if (method === 'initialize') {
    return json({
      jsonrpc: '2.0',
      id,
      result: { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'proofworks', version: '0.2.0' } },
    });
  }
  if (method === 'tools/list') {
    return json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          { name: 'claim_verify', description: 'Verify claims in AI text against sources (or compute arithmetic) and return immediate claim-by-claim verdicts', inputSchema: { type: 'object', properties: { ai_text: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } }, required: ['ai_text'] } },
          { name: 'claim_check', description: 'Verify a single claim sentence (computable or source-backed) and return one verdict', inputSchema: { type: 'object', properties: { claim: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } }, required: ['claim'] } },
          { name: 'corpus_search', description: 'Return human-confirmed + source-backed claim corpus (what has already been verified)', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
        ],
      },
    });
  }
  if (method === 'tools/call') {
    const tool = (body as any).params?.name ?? '';
    const args = (body as any).params?.arguments ?? {};
    if (tool === 'claim_verify') {
      const res = await runVerify(env, args);
      const data = await res.json();
      return json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(data) }] } });
    }
    if (tool === 'claim_check') {
      const claim = typeof args.claim === 'string' ? args.claim : '';
      const sources = Array.isArray(args.sources) ? args.sources.map(String) : [];
      if (!claim.trim()) return json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'claim required' } });
      const [result] = await matchClaims([claim.trim()], sources);
      return json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } });
    }
    if (tool === 'corpus_search') {
      const rows = await getVerifiedCorpus(env, Number(args.limit) || 50);
      return json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(rows) }] } });
    }
    return json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + tool } });
  }
  return json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown method' } });
}