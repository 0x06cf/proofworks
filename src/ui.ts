// ui.ts
// Proofworks — human-facing web app (landing + claim checker).
// No build step: one self-contained HTML string served at /. The page is a
// crafted, editorial-style landing with a functional claim checker that posts
// to /api/* on the same worker. Uses event delegation (no inline onclick) so
// generated markup never has nested-quote bugs.

import type { Env } from './db';
import { createCheck, setClaimHumanVerdict, getVerifiedCorpus } from './db';
import { extractClaims, matchClaims } from './claim-engine';

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Proofworks - a deterministic verification oracle: compute arithmetic, convert units, match claims against sources. A confidence ladder, no LLM grading an LLM.">
<link rel="canonical" href="https://sentrylab.app/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://sentrylab.app/">
<meta property="og:title" content="Proofworks — verify AI answers without AI">
<meta property="og:description" content="Deterministic verification oracle. Computes arithmetic and checks claims against sources. certain · source-backed · unverifiable — never a fake yes.">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Proofworks",
  "url": "https://sentrylab.app/",
  "description": "Human-verified AI claim checker",
  "publisher": { "@type": "Organization", "name": "Proofworks" }
}
</script>
<title>Proofworks — verify AI answers without AI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#f6f4ee; --bg2:#efe9db; --panel:#fdfcf8; --panel2:#fff;
    --ink:#1c1a15; --ink2:#4a463c; --muted:#7a7466;
    --line:#e3decb; --line2:#cbc4aa;
    --accent:#2f5d46; --accent-ink:#e8f3ec;
    --gold:#b9872f;
    --ok:#1e7a43;  --okbg:#e4f2e8;
    --warn:#a06712; --warnbg:#fbf0d8;
    --bad:#b23a2e; --badbg:#fbe6e2;
    --ques:#8250a0; --quesbg:#f2e9f7;
    --shadow:0 1px 2px rgba(28,26,21,.05), 0 8px 24px rgba(28,26,21,.06);
    --shadow-lg:0 2px 4px rgba(28,26,21,.06), 0 20px 50px rgba(28,26,21,.10);
  }
  *{box-sizing:border-box;}
  body{margin:0; background:var(--bg); color:var(--ink);
    font-family:'Inter',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    line-height:1.55; font-size:16px; -webkit-font-smoothing:antialiased;
    background-image:radial-gradient(circle at 15% -10%, rgba(47,93,70,.06), transparent 45%),
                     radial-gradient(circle at 90% 0%, rgba(185,135,47,.05), transparent 40%);
  }
  .serif{font-family:'Newsreader',Georgia,'Times New Roman',serif;}
  a{color:var(--accent); text-decoration:none;}

  .mast{max-width:1060px; margin:0 auto; padding:22px 26px; display:flex; align-items:center; gap:14px;
        border-bottom:1px solid var(--line);}
  .brand{display:flex; align-items:center; gap:10px; font-weight:700; letter-spacing:.2px; font-size:16px;}
  .brand .mark{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;
    background:linear-gradient(135deg,var(--accent),#3a7a58); color:#fff; font-size:16px; box-shadow:var(--shadow);}
  .brand small{display:block;font-weight:400;color:var(--muted);font-size:11.5px;letter-spacing:.4px;margin-top:-2px;}
  .mast .right{margin-left:auto;display:flex;align-items:center;gap:18px;color:var(--muted);font-size:13px;}

  .hero{max-width:1060px;margin:0 auto;padding:66px 26px 30px;text-align:center;}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;letter-spacing:2.2px;text-transform:uppercase;
    color:var(--accent);font-weight:600;border:1px solid var(--line2);padding:6px 13px;border-radius:999px;background:rgba(255,255,255,.5);}
  .hero h1{font-family:'Newsreader',serif;font-size:clamp(38px,6vw,66px);line-height:1.02;font-weight:500;
    letter-spacing:-.015em;margin:20px 0 0;}
  .hero h1 em{font-style:italic;color:var(--accent);}
  .hero p.sub{max-width:600px;margin:20px auto 0;color:var(--ink2);font-size:17px;}
  .hero-actions{display:flex;gap:12px;justify-content:center;margin-top:28px;flex-wrap:wrap;}

  .btn{display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;font-weight:600;font-size:14.5px;
    padding:12px 20px;border-radius:999px;transition:transform .12s ease, box-shadow .12s ease, background .15s ease, color .15s;}
  .btn:active{transform:translateY(1px);}
  .btn.primary{background:var(--accent);color:#eaf4ee;box-shadow:0 2px 6px rgba(47,93,70,.28);}
  .btn.primary:hover{background:#37694f;box-shadow:0 4px 16px rgba(47,93,70,.34);}
  .btn.ghost{background:transparent;border:1px solid var(--line2);color:var(--ink);}
  .btn.ghost:hover{border-color:var(--accent);color:var(--accent);background:#fff;}

  .trustline{margin-top:18px;color:var(--muted);font-size:12.5px;}
  .trustline b{color:var(--ink2);}

  .how{max-width:1060px;margin:56px auto 0;padding:0 26px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .step{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px 20px;box-shadow:var(--shadow);}
  .step .n{font-family:'Newsreader',serif;font-size:26px;color:var(--accent);line-height:1;}
  .step h3{margin:8px 0 6px;font-size:15px;}
  .step p{margin:0;color:var(--muted);font-size:13.5px;}

  .checker{max-width:860px;margin:46px auto 0;padding:0 26px;}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow-lg);padding:30px 30px 26px;}
  .card h2{margin:0 0 4px;font-size:21px;}
  .card .note{color:var(--muted);font-size:13.5px;margin:0 0 18px;}
  label{display:block;margin:16px 0 6px;font-size:13px;font-weight:600;color:var(--ink2);}
  textarea{width:100%;background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:12px;
    padding:12px 14px;font:inherit;font-size:14px;resize:vertical;transition:border-color .12s, box-shadow .12s;}
  textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(47,93,70,.14);}
  textarea::placeholder{color:#9aa28f;}
  .benefit{margin-top:12px;font-size:12.5px;color:var(--muted);}

  .runrow{display:flex;align-items:center;gap:14px;margin-top:18px;flex-wrap:wrap;}
  .runrow .btn{margin-right:auto;}
  .runrow .hint{color:var(--muted);font-size:12.5px;}

  .summary{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0;}
  .stat{flex:1;min-width:110px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;text-align:center;}
  .stat .lab{display:block;font-size:11px;color:var(--muted);}
  .stat .num{display:block;font-size:26px;font-family:'Newsreader',serif;font-weight:500;line-height:1.1;margin-top:2px;}

  .claim{background:var(--panel2);border:1px solid var(--line);border-left:4px solid var(--line2);border-radius:12px;
    padding:14px 16px;margin:12px 0;box-shadow:0 1px 2px rgba(28,26,21,.03);}
  .claim .txt{font-size:14.5px;}
  .claim .meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px;}
  .claim.supported{border-left-color:var(--ok);}
  .claim.unsupported{border-left-color:var(--bad);}
  .claim.confirmed{border-left-color:#1a6bf0;}
  .claim.refuted{border-left-color:#b23a2e;}
  .badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;}
  .badge::before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.9;}
  .badge.supported{background:var(--okbg);color:var(--ok);}
  .badge.partial{background:var(--warnbg);color:var(--warn);}
  .badge.unsupported{background:var(--badbg);color:var(--bad);}
  .badge.no_source{background:#ececec;color:#5b5b5b;}
  .badge.confirmed{background:#e4ecfd;color:#1a6bf0;}
  .badge.refuted{background:var(--badbg);color:var(--bad);}
  .badge.unverifiable{background:#f1eef2;color:#6b6b6b;}
  .badge.flag{background:transparent;border:1px solid var(--line2);color:var(--muted);}
  .badge.flag::before{content:'';width:0;height:0;}
  .src{font-size:12px;color:var(--accent);background:rgba(47,93,70,.08);padding:2px 8px;border-radius:6px;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .snippet{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5;background:var(--bg2);border-radius:8px;padding:8px 10px;}
  .btn-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
  .btn-row .btn{padding:8px 14px;font-size:13px;}
  .btn-row .juryok{background:var(--ok);color:#fff;}
  .btn-row .juryok:hover{background:#19683a;}
  .btn-row .jurybad{background:#fff;border:1px solid var(--line2);color:var(--bad);}
  .btn-row .jurybad:hover{border-color:var(--bad);background:var(--badbg);}

  .corpuswrap{margin-top:56px;}
  .corpus{background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:hidden;}
  .corpus .head{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line);}
  .corpus .head .title{font-weight:700;font-size:15px;}
  .corpus .head .sub{color:var(--muted);font-size:12.5px;}
  .corpus .head .count{margin-left:auto;font-family:'Newsreader',serif;font-size:22px;color:var(--accent);}
  .corpus .row{display:flex;gap:12px;align-items:flex-start;padding:13px 20px;border-bottom:1px solid var(--line2);font-size:13.5px;}
  .corpus .row:last-child{border-bottom:0;}
  .corpus .row .v{flex:none;width:86px;font-weight:600;font-size:12px;padding-top:1px;}
  .corpus .row .v.supported{color:var(--ok);} .corpus .row .v.rejected{color:var(--bad);}
  .corpus .row .t{color:var(--ink2);}
  .corpus .empty{padding:26px;text-align:center;color:var(--muted);font-size:13.5px;}

  footer{max-width:1060px;margin:64px auto 0;padding:30px 26px;border-top:1px solid var(--line);display:flex;
    align-items:center;gap:16px;color:var(--muted);font-size:12.5px;flex-wrap:wrap;}
  footer .right{margin-left:auto;display:flex;gap:18px;}

  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#eef5ef;color:var(--ok);
    border:1px solid var(--line);border-radius:999px;padding:10px 20px;font-size:13.5px;font-weight:600;box-shadow:var(--shadow-lg);
    opacity:0;pointer-events:none;transition:opacity .2s, transform .2s;z-index:50;}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

  .loading{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13.5px;margin-top:16px;}
  .spinner{width:16px;height:16px;border:2px solid var(--line2);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}

  @media(max-width:720px){
    .how{grid-template-columns:1fr;}
    .hero{padding:44px 22px 20px;}
    .mast .right{display:none;}
  }
</style>
</head>
<body>

<header class="mast">
  <div class="brand">
    <span class="mark">✓</span>
    <span style="display:flex;flex-direction:column;line-height:1.1;">
      <span>Proofworks</span>
      <small>DETERMINISTIC VERIFICATION ORACLE</small>
    </span>
  </div>
  <div class="right">
    <span>No LLM grades this</span>
    <span>·</span>
    <span>open API · MCP</span>
  </div>
</header>

<section class="hero">
  <div class="eyebrow">Don't trust it. Prove it.</div>
  <h1 class="serif">AI told you something.<br>Verify it <em>without</em> AI.</h1>
  <p class="sub">Proofworks is a deterministic verification oracle. It computes arithmetic, converts units, checks dates, and matches claims against real sources — returning an immediate verdict with a confidence ladder. No LLM grades an LLM here; computation and sources are the judge.</p>
  <div class="hero-actions">
    <a class="btn primary" href="#checker">Verify an answer</a>
    <a class="btn ghost" href="#corpus-sec">See what's been checked</a>
  </div>
  <div class="trustline"><b>Every verdict is trusted, or says it can't be.</b> <code>certain</code> · <code>source-backed</code> · <code>unverifiable</code> — never a fake yes.</div>
</section>

<section class="how">
  <div class="step"><div class="n">01</div><h3>Compute</h3><p>Arithmetic, ratios and dates are solved exactly — the model's number is either right or it's not, before any source is fetched.</p></div>
  <div class="step"><div class="n">02</div><h3>Match</h3><p>Claims that aren't arithmetic are checked against the sources you supply, claim by claim, with a token-overlap confidence.</p></div>
  <div class="step"><div class="n">03</div><h3>Admit</h3><p>Anything we can't compute or trace returns <code>unverifiable</code>. An oracle that admits its limits beats one that hallucinates certainty.</p></div>
</section>

<section class="checker" id="checker">
  <div class="card">
    <h2 class="serif">Verify an answer</h2>
    <p class="note">Paste text and any sources. You get an immediate verdict per claim with a confidence ladder — <code>certain</code> (computed), <code>source-backed</code> (matched), or <code>unverifiable</code> (admitted).</p>

    <label for="ai">AI-generated text to verify</label>
    <textarea id="ai" rows="6" placeholder="e.g.  D1 costs $0.30 per 1M requests and reads are eventually consistent. The Workers runtime LTS is supported until 2027."></textarea>

    <label for="srcs">Source URLs <span style="font-weight:400;color:var(--muted)">(one per line, optional)</span></label>
    <textarea id="srcs" rows="3" placeholder="https://developers.cloudflare.com/d1/...&#10;https://blog.cloudflare.com/..."></textarea>

    <div class="benefit">We read each source and match it against every claim. We never invent a citation.</div>

    <div class="runrow">
      <button class="btn primary" id="run">Check claims →</button>
      <span class="hint">Claim-by-claim, most-of-sentence breakdown.</span>
    </div>
    <div class="loading" id="loading" style="display:none"><span class="spinner"></span> Splitting sentences &amp; fetching sources…</div>
  </div>
</section>

<div class="checker" id="results" style="display:none;margin-top:24px;">
  <div class="card">
    <h2 class="serif">Verdict per claim</h2>
    <p class="note">Deterministic results need no tap. For source-backed claims, tap <b>Verify</b>, <b>Reject</b>, or <b>?</b> to record a human call — it upgrades the corpus for other agents.</p>
    <div class="summary" id="summary"></div>
    <div id="claimlist"></div>
  </div>
</div>

<section class="checker corpuswrap" id="corpus-sec">
  <div class="card corpus">
    <div class="head">
      <div>
        <div class="title">The verified ledger</div>
        <div class="sub">Claims people have marked by hand, open for agents to check against.</div>
      </div>
      <div class="count" id="corpuscount">—</div>
    </div>
    <div id="corpuslist"><div class="empty">The ledger is waiting for its first entries.</div></div>
    <button class="btn ghost" id="loadcorpus" style="margin:16px 20px 20px;">Load recent verifications</button>
  </div>
</section>

<footer>
  <div class="brand" style="font-size:13px;">✓ <b>Proofworks</b></div>
  <div>AI answers faster than they admit holes. We keep the receipt.</div>
  <div class="right">
    <a href="#checker">Check a claim</a>
    <a href="#corpus-sec">Ledger</a>
  </div>
</footer>

<div class="toast" id="toast"></div>

<script>
const $=(s)=>document.querySelector(s);
const esc=(s)=>(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(m)=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);};

$('#run').onclick=async()=>{
  const ai_text=$('#ai').value.trim();
  const sources=$('#srcs').value.split(/\\n+/).map(s=>s.trim()).filter(Boolean);
  if(!ai_text){toast('Paste some text first.');return;}
  const btn=$('#run');btn.disabled=true;btn.style.opacity=.6;
  const ld=$('#loading');ld.style.display='flex';
  try{
    const res=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ai_text,sources})});
    if(!res.ok)throw new Error('bad status');
    const data=await res.json();
    renderResults(data);
  }catch(e){toast('Something broke — try again.');}
  finally{btn.disabled=false;btn.style.opacity=1;ld.style.display='none';$('#results').scrollIntoView({behavior:'smooth'});}
};

function renderResults(data){
  const r=$('#results');r.style.display='block';
  const real=(data.claims||[]);
  const counts={confirmed:0,refuted:0,supported:0,partial:0,unsupported:0,no_source:0,unverifiable:0};
  real.forEach(c=>{counts[c.verdict]=(counts[c.verdict]||0)+1;});
  const order=[['confirmed','certain'],['refuted','refuted'],['supported','supported'],['partial','partially supported'],['unsupported','source mismatch'],['no_source','no source'],['unverifiable','unverifiable']];
  $('#summary').innerHTML=(order.filter(o=>counts[o[0]]>0).map(o=>
    '<div class="stat"><span class="lab">'+o[1]+'</span><span class="num">'+counts[o[0]]+'</span></div>').join(''))||'<div class="stat"><span class="lab">no claims</span><span class="num">0</span></div>';

  $('#claimlist').innerHTML=real.map((c,i)=>{
    const confLabel=(c.confidence==='certain'&&c.computed&&c.computed.result)
      ?' <span class="badge flag">⟦ <b>'+esc(String(c.computed.result))+'</b> ⟧</span>'
      :(c.confidence?' <span class="badge flag">'+esc(c.confidence)+'</span>':'');
    const badge='<span class="badge '+c.verdict+'">'+String(c.verdict).replace(/_/g,' ')+'</span>'+confLabel;
    const useCls=['supported','confirmed'].includes(c.verdict)?('claim '+(c.verdict==='confirmed'?'confirmed':'supported'))
      :(['partial','unverifiable','no_source'].includes(c.verdict)?'claim '+(c.verdict==='unverifiable'?'unverifiable':'')
      :'claim refuted');
    // 0.9.0: claims that are already 'certain' (confirmed/refuted) don't need a human jury button.
    const juryRow=(c.verdict==='confirmed'||c.verdict==='refuted')
      ?'<div class="meta"><span class="badge flag">deterministic — no human tap needed</span></div>'
      : '<div class="btn-row" data-cid="'+c.id+'">'+
          '<button class="btn juryok" data-act="confirmed">✓ Verify</button>'+
          '<button class="btn jurybad" data-act="rejected">✗ Reject</button>'+
          '<button class="btn ghost" data-act="flagged">? Flag</button>'+
        '</div>';
    return '<div class="'+useCls+'">'+
      '<div class="txt">'+(i+1)+'. '+esc(c.claim_text)+'</div>'+
      '<div class="meta">'+badge+(c.source_url?'<span class="src">'+esc(c.source_url)+'</span>':'')+'</div>'+
      (c.source_snippet?'<div class="snippet">'+esc(c.source_snippet.slice(0,200))+'…</div>':'')+
      juryRow+'</div>';
  }).join('');
}

async function jury(id,v,el,row){
  if(!id) return;
  const res=await fetch('/api/claim/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({verdict:v})});
  if(res.ok){
    const r=(row&&row.querySelector('.btn-row'))?row:el.closest('.claim');
    const row2=el.closest('.claim');
    if(row2)row2.querySelectorAll('.juryok,.jurybad,.ghost').forEach(b=>b.disabled=true);
    el.textContent=(v==='confirmed'?'✓ Verified by you':(v==='rejected'?'✗ Marked false':'? Flagged'));
    el.disabled=true;
    toast((v==='confirmed')?'Recorded — added to the ledger.':(v==='rejected'?'Marked false.':'Flagged.'));
    refreshCorpus();
  }
}

// Event delegation for claim actions (no inline onclick => no quoting bugs in served markup).
$('#claimlist').addEventListener('click', async (e)=>{
  const btn=e.target.closest('button[data-act]');
  if(!btn) return;
  const id=btn.parentElement ? btn.parentElement.getAttribute('data-cid') : null;
  await jury(id, btn.getAttribute('data-act'), btn);
});

async function refreshCorpus(){
  try{
    const res=await fetch('/api/corpus?limit=25');
    if(!res.ok) return;
    const rows=await res.json();
    $('#corpuscount').textContent=rows.length||'—';
    $('#corpuslist').innerHTML=rows.length?rows.map(r=>'<div class="row">'+
      '<span class="v '+((r.human_verdict)||'').toLowerCase()+'">'+esc(r.human_verdict||r.final_verdict||'')+'</span>'+
      '<span class="t">'+esc(r.claim_text||'')+'</span></div>').join(''):'<div class="empty">The verified ledger is waiting for its first entries.</div>';
  }catch(e){}
}

$('#loadcorpus').onclick=()=>refreshCorpus();
refreshCorpus();
</script>
</body>
</html>`;

function html(): Response {
  return new Response(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function handleUi(req: Request, env: Env, url: URL): Promise<Response> {
  if (req.method === 'GET') {
    if (url.pathname === '/' || url.pathname === '') return html();
    return new Response('Not found', { status: 404 });
  }
  if (url.pathname === '/api/verify') {
    return verifyEndpoint(req, env);
  }
  if (url.pathname.startsWith('/api/claim/')) {
    const claimId = Number(url.pathname.split('/').pop());
    const body: any = await req.json().catch(() => null);
    const v = body?.verdict;
    if (claimId && ['confirmed', 'rejected', 'flagged'].includes(v)) {
      await setClaimHumanVerdict(env, claimId, v);
      return json({ ok: true });
    }
    return json({ error: 'bad' }, 400);
  }
  return json({ error: 'not found' }, 404);
}

async function verifyEndpoint(req: Request, env: Env): Promise<Response> {
  const body: any = await req.json().catch(() => null);
  if (!body || typeof body.ai_text !== 'string') return json({ error: 'ai_text required' }, 400);
  const ai_text = body.ai_text;
  const sources = Array.isArray(body.sources) ? body.sources.map(String) : [];
  const claimTexts = extractClaims(ai_text);
  const claims = await matchClaims(claimTexts, sources);
  const { checkId, claimIds } = await createCheck(env, 1, ai_text, claims);
  const withIds = claims.map((c, i) => ({ ...c, id: claimIds[i] }));
  return json({ checkId, claims: withIds });
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}