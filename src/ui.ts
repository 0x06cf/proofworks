// ui.ts
// Human-facing Proofworks web app: paste -> claim rows -> Confirm/Reject -> trust report.
// Served as a clean single-page app. No build step; HTML + a little JS that calls back
// into /api/* endpoints (same worker) or plain forms.

import type { Env } from './db';
import { createCheck, setClaimHumanVerdict, getVerifiedCorpus } from './db';
import { extractClaims, matchClaims } from './claim-engine';

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Proofworks — human-verified AI claim checker</title>
<style>
  :root { --bg:#0f1115; --panel:#171a21; --border:#262b36; --text:#e6e9ef; --muted:#8a93a3;
          --green:#2ecc71; --red:#e74c3c; --amber:#f1c40f; --accent:#3b82f6; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:var(--bg); color:var(--text); line-height:1.5; }
  header { border-bottom:1px solid var(--border); padding:14px 24px; display:flex; align-items:center; gap:10px; }
  header .logo { font-weight:700; letter-spacing:.3px; font-size:18px; }
  header .tag { color:var(--muted); font-size:13px; }
  main { max-width:800px; margin:0 auto; padding:24px; }
  textarea, input[type=url] { width:100%; background:var(--panel); color:var(--text); border:1px solid var(--border); border-radius:8px; padding:12px; font:inherit; }
  label { display:block; margin:14px 0 6px; color:var(--muted); font-size:13px; }
  button { background:var(--accent); color:#fff; border:0; border-radius:8px; padding:10px 16px; font-weight:600; cursor:pointer; }
  button.secondary { background:transparent; border:1px solid var(--border); color:var(--text); }
  .claim { background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:12px 14px; margin:10px 0; }
  .claim .txt { margin-bottom:6px; }
  .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:600; }
  .supported .badge { background:rgba(46,204,113,.15); color:var(--ok); }
  .partial .badge { background:rgba(241,196,15,.15); color:var(--amber); }
  .unsupported .badge, .no_source .badge { background:rgba(231,76,60,.15); color:var(--red); }
  .btn-row { margin-top:10px; display:flex; gap:8px; }
  .err { color:var(--red); }
  .muted { color:var(--muted); font-size:13px; }
  .source { font-size:12px; color:var(--muted); }
  .summary { display:flex; gap:16px; flex-wrap:wrap; margin-top:16px; }
  .stat { background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:10px 16px; }
  .stat b { font-size:20px; }
  pre.corpus { background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:12px; overflow:auto; max-height:200px; font-size:12px; }
</style>
</head>
<body>
<header>
  <span class="logo">✓ Proofworks</span>
  <span class="tag">human-verified AI claim checker · free</span>
</header>
<main>
  <div id="step-input">
    <label for="ai">Paste the AI-generated text you want to check</label>
    <textarea id="ai" rows="6" placeholder="e.g. 'Cloudflare D1 costs $0.30/1M requests per row and supports session-consistent reads for up to 10 seconds. The LTS release is supported until 2027.'"></textarea>
    <label for="srcs">Source URLs (one per line, optional)</label>
    <textarea id="srcs" rows="3" placeholder="https://developers.cloudflare.com/d1/...&#10;https://blog.cloudflare.com/..."></textarea>
    <div style="margin-top:16px"><button id="run">Check claims</button></div>
    <p class="muted">No LLM in the loop — this splits your text into claims and matches them to your sources. You review the flags.</p>
  </div>

  <div id="results" style="display:none"></div>
  <div id="report" style="display:none"></div>
  <hr style="border-color:var(--border);margin:28px 0">
  <h3>What humans already verified</h3>
  <button class="secondary" id="loadcorpus">Load recent verified corpus</button>
  <div id="corpus"></div>
</main>
<script>
const $ = (s) => document.querySelector(s);
const esc = (s) => (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

$('#run').onclick = async () => {
  const ai_text = $('#ai').value;
  const sources = $('#srcs').value.split(/\\n+/).map(s=>s.trim()).filter(Boolean);
  if (!ai_text.trim()) return;
  const res = await fetch('/api/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ai_text, sources }) });
  if (!res.ok) return;
  const data = await res.json();
  renderResults(data);
};

async function renderResults(data) {
  const r = $('#results'); r.style.display='block';
  const real = data.claims || [];
  let html = '<h3>Claim-by-claim verdict</h3>';
  const counts = { supported:0, partial:0, unsupported:0, no_source:0 };
  real.forEach((c, i) => { counts[c.verdict] = (counts[c.verdict]||0)+1; });
  const sum = Object.entries(counts).map(([k,v])=>'<div class="stat"><span class="muted">'+k+'</span><br><b>'+v+'</b></div>').join('');
  html += '<div class="summary">'+ sum +'</div>';

  real.forEach((c,i)=>{
    const cls = ['partial','unsupported','no_source'].includes(c.verdict) ? c.verdict : 'supported';
    html += '<div class="claim '+cls+'">';
    html += '<div class="claim">'+esc(c.claim_text)+'</div>';
    html += '<span class="badge">'+esc(c.verdict)+'</span>';
    if (c.source_url) html += ' &nbsp;<span class="source">source: '+esc(c.source_url)+'</span>';
    if (c.source_snippet) html += '<div class="source">'+esc(c.source_snippet.slice(0,180))+'…</div>';
    html += '<div class="btn-row">';
    html += '<button onclick="verdict('+c.id+',\'confirmed\',this)">✓ Confirm</button>';
    html += '<button class="secondary" onclick="verdict('+c.id+',\'rejected\',this)">✗ Reject</button>';
    html += '<button class="secondary" onclick="verdict('+c.id+',\'flagged\',this)">? Flag</button>';
    html += '</div></div>';
  });
  r.innerHTML = html;
}

async function verdict(id, v, el) {
  const res = await fetch('/api/claim/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ verdict: v }) });
  if (res.ok) { if (el) { el.textContent = v; el.disabled = true; } }
}

$('#loadcorpus').onclick = async () => {
  const res = await fetch('/api/corpus?limit=20');
  const data = await res.json();
  document.getElementById('corpus').innerHTML = '<pre class="corpus">'+esc(JSON.stringify(data,null,2))+'</pre>';
};
</script>
</body>
</html>`;

function html(res: Response): Response {
  return new Response(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function handleUi(req: Request, env: Env, url: URL): Promise<Response> {
  if (req.method === 'GET') {
    if (url.pathname === '/' || url.pathname === '' ) return html(new Response(PAGE));
    return new Response('Not found', { status: 404 });
  }
  // POST endpoints
  if (url.pathname === '/api/verify' ) {
    return verifyEndpoint(req, env);
  }
  if (url.pathname.startsWith('/api/claim/')) {
    const claimId = Number(url.pathname.split('/').pop());
    const body: any = await req.json().catch(()=>null);
    const v = body?.verdict;
    if (claimId && ['confirmed','rejected','flagged'].includes(v)) {
      await setClaimHumanVerdict(env, claimId, v);
      return json({ ok: true });
    }
    return json({ error: 'bad' }, 400);
  }
  return json({ error: 'not found' }, 404);
}

async function verifyEndpoint(req: Request, env: Env): Promise<Response> {
  const body: any = await req.json().catch(()=>null);
  if (!body || typeof body.ai_text !== 'string') return json({ error: 'ai_text required' }, 400);
  const ai_text = body.ai_text;
  const sources = Array.isArray(body.sources) ? body.sources.map(String) : [];
  const claimTexts = extractClaims(ai_text);
  const claims = await matchClaims(claimTexts, sources);
  const { checkId, claimIds } = await createCheck(env, 1, ai_text, claims);
  const withIds = claims.map((c,i)=>({ ...c, id: claimIds[i] }));
  return json({ checkId, claims: withIds });
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}