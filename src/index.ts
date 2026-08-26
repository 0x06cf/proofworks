// index.ts
// Proofworks — a research tool that verifies its own citations (MCP / API).
// Routing:
//   agent.ts   -> /robots.txt, /sitemap.xml, /llms.txt, /openapi.json,
//                 /.well-known/*, /agent-setup/prompt.md, /mcp.json
//   ui.ts      -> /  (tiny onboarding landing)
//   mcp.ts     -> /mcp (MCP), /api/verify, /api/claim, /api/corpus

import type { Env } from './db';
import { handleUi } from './ui';
import { handleApi } from './mcp';
import { handleAgentStatic } from './agent';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // --- Agent-readiness static files (robots, sitemap, llms.txt, .well-known, prompt.md, mcp.json) ---
    const agentRes = await handleAgentStatic(url);
    if (agentRes) return agentRes;

    // --- MCP / API surface ---
    if (url.pathname === '/mcp' || url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    // --- Human-facing: just the tiny onboarding landing at / ---
    return handleUi(request, env, url);
  },
};