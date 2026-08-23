// index.ts
// Proofworks — human-verified AI claim checker.
// Entry worker: routes to the human web app (/), the JSON API (/api/*), or the MCP surface (/mcp).

import type { Env } from './db';
import { handleUi } from './ui';
import { handleApi } from './mcp';
import { handleAgentStatic } from './agent';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // --- Agent-readiness static files (robots, sitemap, llms.txt, .well-known) ---
    const agentRes = await handleAgentStatic(url);
    if (agentRes) return agentRes;

    // --- MCP / agent API surface ---
    if (url.pathname === '/mcp' || url.pathname.startsWith('/api/')) {
      // /api/verify and /api/claim/* are also handled by handleApi (REST); the UI uses them too.
      if (url.pathname === '/api/verify' && request.method === 'POST') {
        // UI + agent share the same verify endpoint; route through the UI handler for claim ids.
        return handleUi(request, env, url);
      }
      if (url.pathname.startsWith('/api/claim/')) {
        return handleUi(request, env, url);
      }
      return handleApi(request, env, url);
    }

    // --- Human web app ---
    return handleUi(request, env, url);
  },
};