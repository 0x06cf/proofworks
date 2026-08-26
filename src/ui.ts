// ui.ts
// Proofworks is an MCP / API server, not a consumer web app. `/` serves a tiny
// static landing that (a) says what this is, (b) hands the agent an onboarding
// snippet, and (c) links to the full self-install prompt. There is no SPA and
// no human-verification jury anymore — the human tap was removed in the pivot.

export const ORIGIN = 'https://sentrylab.app';

const LANDING = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Proofworks is an MCP server — a deterministic verification oracle. Onboard your AI agent to verify claims it makes.">
<link rel="canonical" href="${ORIGIN}/">
<meta property="og:type" content="website">
<meta property="og:url" content="${ORIGIN}/">
<meta property="og:title" content="Proofworks — verify AI claims without AI">
<meta property="og:description" content="A deterministic verification oracle as an MCP server: compute arithmetic, check dates, match claims against sources — certain / source-backed / unverifiable.">
<meta property="og:image" content="${ORIGIN}/og.png">
<title>Proofworks — deterministic verification MCP</title>
<style>
  :root{--bg:#0c0f12;--fg:#e7e9ec;--muted:#9aa3ad;--accent:#3b82f6;--line:#1e242b;--code:#131a21;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:system-ui,-apple-system,'Inter',sans-serif;line-height:1.55;min-height:100vh}
  .wrap{max-width:760px;margin:0 auto;padding:56px 24px 72px}
  .kicker{color:var(--accent);font-size:13px;letter-spacing:.14em;text-transform:uppercase;font-weight:600}
  h1{font-size:clamp(28px,5vw,40px);line-height:1.1;font-weight:650;margin:14px 0 10px;letter-spacing:-.01em}
  h1 em{font-style:normal;color:var(--accent)}
  .sub{color:var(--muted);font-size:17px;max-width:56ch}
  .ladder{margin:14px 0 0;display:flex;flex-wrap:wrap;gap:8px}
  .ladder span{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:3px 9px;background:var(--code)}
  .card{background:var(--code);border:1px solid var(--line);border-radius:12px;padding:20px;margin-top:28px}
  .card h2{font-size:16px;font-weight:600;margin-bottom:6px}
  .card p{color:var(--muted);font-size:14px;margin-bottom:14px}
  pre{background:#0a0e12;border:1px solid var(--line);border-radius:8px;padding:14px;overflow-x:auto;font-size:13px;line-height:1.5}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  pre code{color:#c8d3de}
  .btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#fff;font-weight:600;font-size:14px;border:0;border-radius:8px;padding:10px 16px;cursor:pointer;margin-top:16px}
  a{color:var(--accent)}
  .foot{margin-top:40px;color:var(--muted);font-size:13px}
  .foot a{color:var(--muted)}
  textarea#cfg{display:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="kicker">Deterministic verification oracle · MCP server</div>
  <h1>Don't trust the AI.<br>Have it <em>prove</em> the claim.</h1>
  <p class="sub">Proofworks is an MCP server your agent connects to. It computes arithmetic, ratios and dates exactly, and matches claims against real sources — returning <b>certain</b>, <b>source-backed</b>, or <b>unverifiable</b>. Never a fake yes.</p>
  <div class="ladder"><span>+ claim_verify</span><span>+ claim_check</span><span>+ corpus_search</span></div>

  <div class="card">
    <h2>Onboard your agent</h2>
    <p>Register the server in your agent's MCP config (replace with your agent's file). Remote, no auth — public.</p>
    <pre><code id="snippet">{
  "mcpServers": {
    "proofworks": {
      "type": "remote",
      "url": "${ORIGIN}/mcp"
    }
  }
}</code></pre>
    <textarea id="cfg"></textarea>
    <button class="btn" id="copy">Copy config</button>
  </div>

  <div class="card">
    <h2>Or let the agent install itself</h2>
    <p>Tell your agent to fetch and follow the setup prompt, exactly like Cloudflare's agent setup:</p>
    <pre><code>Fetch and execute the instructions to connect me to
the Proofworks MCP server from:
@url:\`${ORIGIN}/agent-setup/prompt.md\`</code></pre>
    <p style="margin-top:12px;margin-bottom:0"><a href="${ORIGIN}/agent-setup/prompt.md">View /agent-setup/prompt.md</a></p>
  </div>

  <div class="foot">
    <a href="${ORIGIN}/llms.txt">llms.txt</a> · <a href="${ORIGIN}/openapi.json">openapi.json</a> · <a href="${ORIGIN}/mcp.json">mcp.json</a> · tools: claim_verify, claim_check, corpus_search
  </div>
</div>

<script>
document.getElementById('copy').addEventListener('click', function () {
  var cfg = document.getElementById('cfg');
  cfg.value = document.getElementById('snippet').textContent;
  cfg.select();
  try { navigator.clipboard.writeText(cfg.value); } catch (e) {}
  var b = this; b.textContent = 'Copied ✓'; setTimeout(function(){ b.textContent = 'Copy config'; }, 1500);
});
</script>
</body>
</html>`;

import type { Env } from './db';

export async function handleUi(req: Request, env: Env, url: URL): Promise<Response> {
  // `/` = tiny onboarding landing. Everything else is handled by agent.ts / mcp.ts.
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(LANDING, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  return json({ error: 'not found' }, 404);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}