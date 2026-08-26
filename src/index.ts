// index.ts
// Proofworks — a research skill for AI agents, plus its static onboarding page.
// Routing:
//   agent.ts -> /robots.txt, /sitemap.xml, /llms.txt,
//               /.well-known/*, /agent-setup/prompt.md, IndexNow keys
//   ui.ts    -> /  (the marketing landing)
//
// No MCP server, no JSON API. The product is a client-side skill; this worker
// only serves the landing and the static files that make the skill findable.

import { handleUi } from './ui';
import { handleAgentStatic } from './agent';

export default {
  async fetch(request: Request, _env: unknown, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // --- Agent-readiness static files (robots, sitemap, llms.txt, .well-known, prompt.md, IndexNow keys) ---
    const agentRes = await handleAgentStatic(url);
    if (agentRes) return agentRes;

    // --- Human-facing: the marketing landing at / ---
    return handleUi(request, _env, url);
  },
};