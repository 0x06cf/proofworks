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
    case '/api/verify': {
      if (req.method !== 'POST') return cors(json({ error: 'POST only' }, 405));
      const body: any = await req.json().catch(() => null);
      if (!body || typeof body.ai_text !== 'string') return cors(json({ error: 'ai_text required' }, 400));
      await runVerify(env, body);
      return cors(json({ ok: true }));
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
  await createCheck(env, 1, aiText, claims);
}

/** Minimal MCP tool methods: proofworks.verifyCheck, proofworks.listCorpus. */
async function handleMcpRequest(req: Request, env: Env): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } });

  const { method, params = {}, id } = body as any;

  if (method === 'initialize') {
    return json({
      jsonrpc: '2.0',
      id,
      result: { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'proofworks', version: '0.1.0' } },
    });
  }
  if (method === 'tools/list') {
    return json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          { name: 'claim_verify', description: 'Check claims in AI text against sources and store a pending check for human review', inputSchema: { type: 'object', properties: { ai_text: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } }, required: ['ai_text'] } },
          { name: 'corpus_search', description: 'Return human-verified claim corpus (what humans already confirmed)', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
        ],
      },
    });
  }
  if (method === 'tools/call') {
    const tool = (body as any).params?.name ?? '';
    const args = (body as any).params?.arguments ?? {};
    if (tool === 'claim_verify') {
      await runVerify(env, args);
      return json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'Check submitted for human review' }] } });
    }
    if (tool === 'corpus_search') {
      const rows = await getVerifiedCorpus(env, Number(args.limit) || 50);
      return json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(rows) }] } });
    }
    return json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + tool } });
  }
  return json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown method' } });
}