// ui.ts
// Proofworks — a research skill that verifies its own citations.
// `/` serves a full marketing landing (hero + demo of the skill's output + offer +
// integrations + use cases + FAQ + CTA). No API, no MCP, no SPA — just the landing.
// Visual system: Vercel-style precision (Geist, shadow-as-border, #171717/#fff)
// with a "verdict/proof" accent set: certain=green, source-backed=blue,
// unverifiable=gray. Mono voice for verdicts and code.

export const ORIGIN = 'https://sentrylab.app';

const LANDING = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Proofworks is a research skill for AI agents. It gathers sources, cites them, then verifies each citation actually supports the claim — matched to a source, or admitted unverifiable.">
<link rel="canonical" href="${ORIGIN}/">
<meta property="og:type" content="website">
<meta property="og:url" content="${ORIGIN}/">
<meta property="og:title" content="Proofworks — let your agent prove it">
<meta property="og:description" content="A research skill for AI agents that verifies its own citations. verified · unsupported · unverifiable. Never a fake yes.">
<title>Proofworks — let your agent prove it</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#ffffff; --ink:#171717; --ink2:#4d4d4d; --ink3:#666666; --line:#ebebeb;
  --ring:rgba(0,0,0,.08);
  /* verdict accent set — the product's own color story */
  --certain:#12805c; --certain-bg:#e7f5ef;
  --source:#0a72ef; --source-bg:#ebf5ff;
  --unver:#7a7a7a; --unver-bg:#f2f2f2;
  --refuted:#c13b2a; --refuted-bg:#fbece9;
  --focus:hsla(212,100%,48%,1);
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:'Geist',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;font-feature-settings:'liga' 1}
::selection{background:#c7dcff}
a{color:var(--ink);text-decoration:none}
a:hover{color:var(--ink2)}
.container{max-width:1120px;margin:0 auto;padding:0 24px}
.mono{font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
.shad{box-shadow:var(--ring) 0 0 0 1px}

/* ---------- verdict chips / ladder ---------- */
.ladder-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.chip{display:inline-flex;align-items:center;gap:7px;font-family:'Geist Mono',ui-monospace,monospace;font-size:12.5px;font-weight:500;padding:4px 10px;border-radius:999px;letter-spacing:.01em}
.chip::before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor}
.chip.certain{background:var(--certain-bg);color:var(--certain)}
.chip.source{background:var(--source-bg);color:var(--source)}
.chip.unver{background:var(--unver-bg);color:var(--unver)}
.chip.refuted{background:var(--refuted-bg);color:var(--refuted)}

/* ---------- topbar + nav ---------- */
.topbar{border-bottom:1px solid var(--line);background:#fbfbfb}
.topbar-inner{max-width:1120px;margin:0 auto;padding:9px 24px;display:flex;justify-content:center;align-items:center;gap:10px;font-size:13px;color:var(--ink3)}
.topbar .dot{width:7px;height:7px;border-radius:50%;background:var(--certain);box-shadow:0 0 0 3px rgba(18,128,92,.15)}
.topbar a{color:var(--ink);font-weight:500}
nav{border-bottom:1px solid var(--line);background:rgba(255,255,255,.92);backdrop-filter:blur(8px);position:sticky;top:0;z-index:50}
.nav-inner{max-width:1120px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:15px;letter-spacing:-.02em}
.brand .mark{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;background:var(--ink);color:#fff;font-size:13px}
.nav-links{display:flex;align-items:center;gap:26px;font-size:14px;font-weight:500;color:var(--ink2)}
.nav-links a{color:var(--ink2)}
.nav-links a:hover{color:var(--ink)}
.nav-cta{display:flex;align-items:center;gap:12px}
.btn{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:500;border-radius:6px;padding:8px 15px;cursor:pointer;border:0;font-family:inherit;color:#fff;background:var(--ink);transition:opacity .12s}
.btn:hover{opacity:.88;color:#fff}
.btn.ghost{background:#fff;color:var(--ink);box-shadow:var(--ring) 0 0 0 1px}
.btn.ghost:hover{background:#f5f5f5;color:var(--ink)}
.menu{display:none}

/* ---------- hero ---------- */
.hero{padding:88px 0 64px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(600px 260px at 50% -40px, rgba(10,114,239,.06), transparent 70%);pointer-events:none}
.kicker{display:inline-flex;align-items:center;gap:8px;font-family:'Geist Mono',monospace;font-size:12.5px;font-weight:500;color:var(--ink3);letter-spacing:.02em;border:1px solid var(--line);border-radius:999px;padding:5px 13px;background:#fff}
.kicker b{color:var(--certain)}
h1{max-width:780px;margin:26px auto 18px;font-size:clamp(42px,6.4vw,68px);font-weight:600;line-height:1.02;letter-spacing:-.035em}
h1 .strike{position:relative;color:var(--ink);white-space:nowrap}
h1 .strike::after{content:'';position:absolute;left:-2%;right:-2%;top:52%;height:max(3px,.045em);background:var(--refuted);border-radius:2px;transform:rotate(-1.2deg)}
h1 .ok{color:var(--certain)}
.hero-sub{max-width:600px;margin:0 auto;font-size:18px;color:var(--ink2);line-height:1.6}
.hero-sub a{color:var(--source);text-decoration:underline;text-decoration-color:rgba(10,114,239,.4);text-underline-offset:2px}
.hero-sub a:hover{text-decoration-color:var(--source)}
.hero-cta{margin:30px 0 14px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.hero-cta .note{width:100%;font-size:13px;color:var(--ink3)}

/* ---------- live verdict demo ---------- */
.demo{max-width:760px;margin:0 auto;position:relative;z-index:2}
.demo-card{background:#fff;border-radius:14px;box-shadow:var(--ring) 0 0 0 1px, rgba(0,0,0,.05) 0 4px 24px -12px;overflow:hidden;text-align:left}
.demo-head{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--line);background:#fbfbfb}
.demo-head .cir{width:11px;height:11px;border-radius:50%}
.demo-head .cir:nth-child(1){background:#ff5f57}.demo-head .cir:nth-child(2){background:#febc2e}.demo-head .cir:nth-child(3){background:#28c840}
.demo-head .title{margin-left:8px;font-family:'Geist Mono',monospace;font-size:12.5px;color:var(--ink3)}
.demo-body{padding:20px 22px 22px}
.demo-static{display:flex;flex-direction:column;gap:10px}
.demo-row{border:1px solid var(--line);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.demo-q{font-size:14px;color:var(--ink);line-height:1.5}
.demo-q .src{display:block;margin-top:4px;font-family:'Geist Mono',monospace;font-size:11.5px;color:var(--ink3)}
.verdict{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:9px;background:#fbfbfb;box-shadow:var(--line) 0 0 0 1px}
.verdict .sym{font-family:'Geist Mono',monospace;font-weight:600;font-size:15px;line-height:1.4;width:20px;text-align:center}
.verdict .txt{flex:1;font-size:14px;line-height:1.45;color:var(--ink)}
.verdict .passage{display:block;margin-top:6px;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:1.5;color:var(--ink2);background:#f3f4f6;border-left:2px solid var(--line);padding:6px 10px;border-radius:0 6px 6px 0}
.verdict .tag{font-family:'Geist Mono',monospace;font-size:11px;font-weight:500;padding:2px 8px;border-radius:999px;white-space:nowrap;margin-top:1px}
.v-certain .sym,.v-certain .tag{color:var(--certain);border-color:rgba(18,128,92,.35)}
.v-certain{background:var(--certain-bg)}
.v-refuted .sym,.v-refuted .tag{color:var(--refuted);border-color:rgba(193,59,42,.35)}
.v-refuted{background:var(--refuted-bg)}
.v-source .sym,.v-source .tag{color:var(--source);border-color:rgba(10,114,239,.35)}
.v-source{background:var(--source-bg)}
.v-unver .sym,.v-unver .tag{color:var(--unver);border-color:rgba(122,122,122,.35)}
.v-unver{background:var(--unver-bg)}
.verdict .tag{border:1px solid;background:#fff}
.demo-hint{margin-top:14px;font-size:12.5px;color:var(--ink3);text-align:center}
.demo-hint button{background:none;border:0;color:var(--source);font-family:'Geist Mono',monospace;font-size:12.5px;cursor:pointer;text-decoration:underline;text-underline-offset:2px;padding:0}

/* ---------- section scaffold ---------- */
section{padding:84px 0}
section.alt{background:#fafafa;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.sec-head{max-width:640px;margin:0 auto 48px;text-align:center}
.eyebrow{font-family:'Geist Mono',monospace;font-size:12.5px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:var(--source);margin-bottom:12px}
h2{font-size:clamp(30px,4.4vw,42px);font-weight:600;line-height:1.1;letter-spacing:-.03em}
.sec-head p{margin-top:14px;font-size:17px;color:var(--ink2);line-height:1.6}

/* ---------- offer: confidence ladder ---------- */
.offer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.offer-card{background:#fff;border-radius:12px;box-shadow:var(--ring) 0 0 0 1px, rgba(0,0,0,.04) 0 2px 8px -6px;padding:24px;display:flex;flex-direction:column;gap:10px}
.offer-card .lvl{font-family:'Geist Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.offer-card.oc-certain .lvl{color:var(--certain)}.offer-card.oc-source .lvl{color:var(--source)}.offer-card.oc-unver .lvl{color:var(--unver)}
.offer-card h3{font-size:20px;font-weight:600;letter-spacing:-.02em}
.offer-card p{font-size:15px;color:var(--ink2);line-height:1.55}
.offer-card .eg{font-family:'Geist Mono',monospace;font-size:12.5px;color:var(--ink3);background:#fbfbfb;border-radius:7px;padding:10px 12px;box-shadow:var(--line) 0 0 0 1px;line-height:1.6;margin-top:auto}
.offer-card .eg .ok{color:var(--certain)}.offer-card .eg .no{color:var(--refuted)}

/* ---------- integrations ---------- */
.int-single{max-width:760px;margin:8px auto 0}
.install-box{background:#0b0d10;border-radius:13px;overflow:hidden;box-shadow:0 20px 60px -30px rgba(0,0,0,.4)}
.install-bar{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:#111419;border-bottom:1px solid #1d2228}
.install-bar span{font-family:'Geist Mono',monospace;font-size:12px;color:#8b949e}
.install-bar button{background:#1e242b;color:#c9d1d9;border:1px solid #2a313a;font-size:12px;font-family:'Geist Mono',monospace;border-radius:6px;padding:5px 10px;cursor:pointer}
.install-bar button:hover{background:#262d36;color:#fff}
pre.code{color:#d4dbe3;font-size:13px;line-height:1.65;padding:16px 18px;overflow-x:auto;font-family:'Geist Mono',ui-monospace,monospace;white-space:pre}
pre.code .cm{color:#5b6470}
pre.code .kw{color:#79b8ff}
pre.code .st{color:#85d39d}
pre.code .fn{color:#f0a0a0}
.int-note{margin-top:16px;font-size:14px;color:var(--ink2)}
.int-note a{color:var(--source);text-decoration:underline;text-underline-offset:2px}

/* ---------- numbers ---------- */
.nums{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.num{border-radius:12px;padding:26px 22px;background:#fff;box-shadow:var(--ring) 0 0 0 1px;text-align:left}
.num .big{font-size:32px;font-weight:600;letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums;display:block;font-family:'Geist Mono',monospace}
.num .big.green{color:var(--certain)}
.num .big.blue{color:var(--source)}
.num p{margin-top:8px;font-size:14px;color:var(--ink2);line-height:1.45}

/* ---------- use cases ---------- */
.uc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.uc-card{border-radius:14px;padding:28px;background:#fff;box-shadow:var(--ring) 0 0 0 1px;display:flex;flex-direction:column;gap:6px}
.uc-card.ucdark{background:#0b0d10;color:#e6eaee;box-shadow:none}
.uc-card.ucdark h3{color:#fff}.uc-card.ucdark p{color:#a4adb8}
.uc-card h3{font-size:19px;font-weight:600;letter-spacing:-.01em}
.uc-card p{font-size:15px;color:var(--ink2);line-height:1.55}
.uc-card .uc-verb{font-family:'Geist Mono',monospace;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--source);margin-bottom:4px}
.uc-card.ucdark .uc-verb{color:#5ea4ff}
.uc-card .ex{font-size:13.5px;color:var(--ink3);background:#f7f7f7;border-radius:8px;padding:10px 12px;margin-top:8px;line-height:1.6}
.uc-card.ucdark .ex{background:#151a20;color:#8f99a4;box-shadow:inset 0 0 0 1px #1f262e}

/* ---------- principle band ---------- */
.principle{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
.principle h2{font-size:clamp(28px,4vw,38px)}
.principle .sub{font-size:17px;color:var(--ink2);line-height:1.65;margin-top:18px;max-width:52ch}
.principle .ladder{display:flex;flex-direction:column;gap:12px;margin-top:26px}
.principle .row{display:flex;align-items:center;gap:12px;font-size:15px;color:var(--ink)}
.principle .row .tag{font-family:'Geist Mono',monospace;font-size:12px;font-weight:500;min-width:118px}
.principle .row .tag.ok{color:var(--certain)}.principle .row .tag.no{color:var(--refuted)}.principle .row .tag.zz{color:var(--unver)}
.principle .codecol{background:#0b0d10;border-radius:14px;overflow:hidden;box-shadow:0 24px 70px -40px rgba(0,0,0,.55)}
.principle .codecol pre{color:#d4dbe3;font-size:13px;line-height:1.7;padding:22px 20px;overflow-x:auto}

/* ---------- resources ---------- */
.res{background:#fafafa;border-top:1px solid var(--line)}
.res .kicker{justify-content:center;margin-bottom:10px}
.res h2{text-align:center}
.res-sub{text-align:center;color:var(--ink2);max-width:560px;margin:14px auto 0;font-size:15px;line-height:1.6}
.res-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;max-width:820px;margin:36px auto 0}
.res-card{display:flex;flex-direction:column;gap:8px;background:#fff;border-radius:12px;padding:20px;box-shadow:var(--ring) 0 0 0 1px;transition:box-shadow .15s}
.res-card:hover{box-shadow:0 4px 20px -10px rgba(0,0,0,.25)}
.res-card .rt{font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:.08em;color:var(--source);text-transform:uppercase}
.res-card h3{font-size:16px;font-weight:600}
.res-card p{font-size:13.5px;color:var(--ink2);line-height:1.5;flex:1}
.res-card .mono{font-family:'Geist Mono',monospace;font-size:12px;color:var(--ink3)}
@media(max-width:640px){.res-grid{grid-template-columns:1fr}}

/* ---------- FAQ ---------- */
.faq{max-width:720px;margin:0 auto}
.faq details{border-bottom:1px solid var(--line);padding:4px 0}
.faq summary{list-style:none;cursor:pointer;padding:18px 0;font-size:16.5px;font-weight:500;display:flex;justify-content:space-between;align-items:center;gap:16px}
.faq summary::after{content:'+';font-family:'Geist Mono',monospace;font-size:19px;color:var(--ink3);font-weight:400;transition:transform .15s}
.faq details[open] summary::after{content:'−'}
.faq .ans{padding:0 0 20px;color:var(--ink2);font-size:15px;line-height:1.65}

/* ---------- footer ---------- */
footer{padding:60px 0 40px;background:#fff;border-top:1px solid var(--line)}
.foot-grid{max-width:1120px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:repeat(4,1fr);gap:32px}
footer h4{font-size:13px;font-weight:600;letter-spacing:.02em;margin-bottom:14px}
footer ul{list-style:none}
footer li{margin-bottom:10px}
footer a{color:var(--ink2);font-size:14px}
footer a:hover{color:var(--ink)}
.foot-bottom{max-width:1120px;margin:26px auto 0;padding:20px 24px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;color:var(--ink3);font-size:13px}
.foot-bottom .legal{display:flex;gap:20px}
.foot-bottom .legal-note{font-family:'Geist Mono',monospace;font-size:12px;color:var(--ink3)}
.foot-bottom a{color:var(--ink3);font-size:13px}

@media(max-width:900px){
  .offer-grid,.nums{grid-template-columns:repeat(2,1fr)}
  .int-row,.principle{grid-template-columns:1fr;gap:40px}
  .uc-grid{grid-template-columns:1fr}
  .hero{padding:64px 0 48px}
  section{padding:64px 0}
}
@media(max-width:640px){
  .nav-links{display:none}
  .nav-cta .ghost{display:none}
  .menu{display:inline-flex}
  .offer-grid,.nums{grid-template-columns:1fr}
  .foot-grid{grid-template-columns:1fr 1fr}
  h1{font-size:40px}
}
</style>
</head>
<body>

<!-- announcement top bar -->
<div class="topbar"><div class="topbar-inner"><span class="dot"></span>Proofworks is a research skill — it verifies its own citations, whichever agent you use. <a href="${ORIGIN}/agent-setup/prompt.md">Adopt the skill →</a></div></div>

<!-- nav -->
<nav>
  <div class="nav-inner">
    <a class="brand" href="${ORIGIN}/"><span class="mark">✓</span>Proofworks</a>
    <div class="nav-links">
      <a href="#offer">The ladder</a>
      <a href="#integrations">Integrations</a>
      <a href="#numbers">Numbers</a>
      <a href="#use-cases">Use cases</a>
      <a href="#faq">FAQ</a>
      <a href="#resources">Resources</a>
    </div>
    <div class="nav-cta">
      <a class="btn ghost" href="#resources">Docs</a>
      <a class="btn" href="#integrations">Onboard an agent</a>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero" style="padding-top:64px">
  <div class="container">
    <div class="kicker"><span>research skill</span> · <b>self-verifying</b> · <span>works with any agent</span></div>
    <h1>Don't let the agent hand you <span class="strike">citations it never checked</span><br>make it <span class="ok">prove</span> its sources.</h1>
    <p class="hero-sub">Proofworks is a research tool for AI agents: it gathers sources, cites them, then <b>checks its own work</b> — confirming each citation actually supports the claim before you trust the answer. <a href="#offer">Arithmetic and dates are computed</a>. Everything else is matched to a real source. What can't be proven is marked <b class="mono" style="color:var(--unver)">unverifiable</b>, not passed off as fact.</p>
    <div class="hero-cta">
      <a class="btn" href="#integrations">Onboard your agent</a>
      <a class="btn ghost" href="#demo" id="tryInline">See a verified answer</a>
      <div class="note">No account, no API key, no hosted server — it runs on your own agent and your own model.</div>
    </div>

    <!-- live verdict demo -->
    <div class="demo" id="demo">
      <div class="demo-card">
              <div class="demo-head">
                <span class="cir"></span><span class="cir"></span><span class="cir"></span>
                <span class="title">proofworks skill — real run, three claims checked against live sources</span>
              </div>
              <div class="demo-body demo-static">
                <div class="demo-row">
                  <div class="demo-q">Claim: "Cloudflare's D1 gives you a serverless SQL database."<span class="src">cited → developers.cloudflare.com/d1</span></div>
                  <div class="verdict v-source"><span class="sym">✓</span><span class="txt"><b>verified</b> — "serverless SQL database" appears in the fetched page: <span class="passage">"Create new <b>serverless SQL databases</b> to query from your Workers and Pages projects."</span></span><span class="tag">verified</span></div>
                </div>
                <div class="demo-row">
                  <div class="demo-q">Claim: "D1 charges 5¢ per million rows read."<span class="src">cited → developers.cloudflare.com/d1/pricing</span></div>
                  <div class="verdict v-refuted"><span class="sym">✗</span><span class="txt"><b>unsupported</b> — the pricing page lists <b>$0.001</b>/million rows read, not 5¢, so the skill suggests that correction instead</span><span class="tag">unsupported · correction</span></div>
                </div>
                <div class="demo-row">
                  <div class="demo-q">Claim: "The Eiffel Tower is in Miami."<span class="src">no source cited</span></div>
                  <div class="verdict v-unver"><span class="sym">—</span><span class="txt"><b>unverifiable</b> — no source to check, so it won't confirm from memory; it flags the likely correction (Paris) for you to verify</span><span class="tag">unverifiable · correction</span></div>
                </div>
              </div>
            </div>
            <div class="demo-hint">A real run captured from the skill. It fetches each cited source, checks the claim against it, and shows the passage that backs (or contradicts) it — including the correction it suggests, which you still decide.</div>
    </div>
  </div>
</section>

<!-- OFFER: how a claim gets verified -->
<section id="offer">
  <div class="container">
    <div class="sec-head">
      <div class="eyebrow">What we offer</div>
      <h2>Every citation gets checked before you trust the answer</h2>
      <p>The point isn't only to say "true" or "false". The point is to show <em>why</em> — and to refuse to fake it when neither a source nor a computation backs a claim.</p>
    </div>
    <div class="offer-grid">
      <div class="offer-card oc-certain">
        <span class="lvl">Verified · passage found</span>
        <h3>Checked against the source</h3>
        <p>The exact quote or number is fetched from the cited source and shown to be there — with the passage that backs it. A claim either checks out or it doesn't.</p>
        <div class="eg">"Workers has a free tier"<br><span class="ok">✓ verified</span> · the passage appears in the fetched docs</div>
      </div>
      <div class="offer-card oc-source">
        <span class="lvl">Strict judgment</span>
        <h3>Reads the passage, doesn't guess</h3>
        <p>When a claim isn't a literal match, the skill reads the fetched source text and asks only: does this passage support the claim as written? It never answers from memory and never rewrites the claim.</p>
        <div class="eg">"15% of 1200 is 200"<br><span class="no">✗ unsupported</span> · the source says 180</div>
      </div>
      <div class="offer-card oc-unver">
        <span class="lvl">Unverifiable · refused</span>
        <h3>It won't fake confidence</h3>
        <p>No source, no computation, no claim. The honest answer is <b>unverifiable</b> — and it flags a likely correction for you to check, rather than passing off a guess as fact.</p>
        <div class="eg">"The Eiffel Tower is in Miami"<br><span class="no">— unverifiable</span>, no source · suggests where it actually is</div>
      </div>
    </div>
  </div>
</section>

<!-- INTEGRATIONS -->
<section class="alt" id="integrations">
  <div class="container">
    <div class="sec-head">
      <div class="eyebrow">Integrations</div>
      <h2>It's a skill. Any agent can pick it up.</h2>
      <p>Proofworks is an agent skill: paste the setup prompt into whatever agent you use and it adopts the verify-and-backfill loop itself. No MCP config, no server setup.</p>
    </div>
    <div class="int-single">
      <div class="install-box">
        <div class="install-bar"><span>&lt;paste this into your agent&gt;</span><button id="copySkill">Copy</button></div>
        <pre class="code" id="skillPrompt">Fetch and execute the setup instructions for the Proofworks skill from @url:\`${ORIGIN}/agent-setup/prompt.md\`</pre>
      </div>
      <div class="int-note">Works with Claude Code, Codex, OpenCode, Windsurf, Cursor, and any agent that can run a skill. Prefer to read it first? <a href="${ORIGIN}/agent-setup/prompt.md">Open the setup prompt →</a></div>
    </div>
  </div>
</section>

<!-- NUMBERS -->
<section id="numbers">
  <div class="container">
    <div class="sec-head">
      <div class="eyebrow">By the numbers</div>
      <h2>Built like infrastructure</h2>
    </div>
    <div class="nums">
      <div class="num"><span class="big green">1</span><p>Verify pass a claim goes through. Its source is fetched and read before it's trusted — deterministic match, then a strict judgment of the passage.</p></div>
      <div class="num"><span class="big blue">∞</span><p>Research it can handle. Source-gathered answers get their citations verified claim by claim.</p></div>
      <div class="num"><span class="big">1</span><p>Prompt to paste. Any agent adopts the skill from a single setup line.</p></div>
      <div class="num"><span class="big">$0</span><p>Cost to start. It runs client-side on your own machine and your own model.</p></div>
    </div>
  </div>
</section>

<!-- USE CASES -->
<section class="alt" id="use-cases">
  <div class="container">
    <div class="sec-head">
      <div class="eyebrow">Use cases</div>
      <h2>Where an agent needs a referee</h2>
    </div>
    <div class="uc-grid">
      <div class="uc-card ucdark">
        <span class="uc-verb">Caught before shipping</span>
        <h3>Arithmetic slips</h3>
        <p>Agents miss decimals, flip signs, round oddly. Run the figure through the skill's check before you trust it in an answer or a dashboard.</p>
        <div class="ex">"The total is 1,248.60" → asks Proofworks what 42 × 29.73 is.</div>
      </div>
      <div class="uc-card">
        <span class="uc-verb">Honest citations</span>
        <h3>Source grounding</h3>
        <p>Before an agent cites a page, verify the claim actually appears there. Source-backed verdicts show the passage that supports the statement.</p>
        <div class="ex">"Workers LTS runs to 2027" → matched against the docs page you passed in.</div>
      </div>
      <div class="uc-card">
        <span class="uc-verb">A number it won't invent</span>
        <h3>Deadline and date math</h3>
        <p>Day-of-week, weeks-between, "is this date valid". The kind of thing an LLM will happily guess at and get wrong.</p>
        <div class="ex">"Dec 1 2027 is a Wednesday" → refuted when it isn't.</div>
      </div>
      <div class="uc-card ucdark">
        <span class="uc-verb">Composed pipelines</span>
        <h3>Agent-to-agent checks</h3>
        <p>A downstream agent runs the skill on an upstream agent's cited output. Verification becomes a step in the pipeline, not a hope.</p>
        <div class="ex">Planner hands off → verifier runs each step → only verified work proceeds.</div>
      </div>
    </div>
  </div>
</section>

<!-- PRINCIPLE BAND -->
<section>
  <div class="container">
    <div class="principle">
      <div>
        <div class="eyebrow">Why it works</div>
        <h2>Research, then check the research</h2>
        <p class="sub">Your agent gathers sources and cites them; Proofworks is the step that <b>checks its own work</b>. The exact quote or number either appears in the fetched source or it doesn't. When it doesn't, a strict read of the passage decides. When neither applies, it says so instead of wallpapering over the gap. That step is what makes the citations you can't check yourself worth trusting.</p>
        <div class="ladder">
          <div class="row"><span class="tag ok mono">verified</span><span>the passage in the fetched source backs the claim</span></div>
          <div class="row"><span class="tag zz mono">unsupported</span><span>no source backs the claim as written</span></div>
          <div class="row"><span class="tag no mono">unverifiable</span><span>honest refusal to guess</span></div>
        </div>
      </div>
      <div class="codecol">
        <pre><span class="cm" style="color:#5b6470">// skill run — a cited claim, checked against its source</span>
BODY  <span class="st" style="color:#85d39d">{"claim": "Jan 1 2027 is a Monday",</span>
      <span class="fn" style="color:#f0a0a0"> "cited_url": "https://example.com/calendar",</span>
      <span class="fn" style="color:#f0a0a0"> "quote": "Jan 1 2027"}</span>

<span style="color:#79b8ff">OUT</span>   <span class="st" style="color:#85d39d">{"tag": "verified",</span>
      <span class="st" style="color:#85d39d"> "matched_fragment": "January 1, 2027 is a Friday",</span>
      <span class="st" style="color:#85d39d"> "source_url": "https://example.com/calendar",</span>
      <span class="st" style="color:#85d39d"> "correction": null}</span></pre>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="alt" id="faq">
  <div class="container">
    <div class="sec-head">
      <div class="eyebrow">FAQ</div>
      <h2>Frequently asked</h2>
    </div>
    <div class="faq">
      <details open>
        <summary>What does Proofworks actually check?</summary>
        <div class="ans">For every claim that cites a source, it verifies that citation. A deterministic first pass asks whether the exact quote or number appears in the fetched source — <b class="mono">verified</b> with the supporting passage. Claims that don't literally match get a strict read of the passage: does it support the claim as written? If nothing backs it, the result is <b class="mono">unsupported</b>. When there's no claim to verify, <b class="mono">unverifiable</b> rather than a guess.</div>
      </details>
      <details>
        <summary>Which agents can use it?</summary>
        <div class="ans">Any agent that can fetch a URL from you and run a skill — Claude Code, Codex, OpenCode, Windsurf, Cursor, GitHub Copilot, or a custom agent. The setup prompt at <span class="mono">/agent-setup/prompt.md</span> <b>is</b> the skill: paste it in and the agent adopts the verify-and-backfill loop itself, on its own machine.</div>
      </details>
      <details>
        <summary>Is it a paid service? Is there a free tier?</summary>
        <div class="ans">It runs client-side on your own agent and your own model, driven by the open-source skill in the repo. Nothing to pay for, no account, no server round-trip. Your research never leaves your machine.</div>
      </details>
      <details>
        <summary>How does the verifying step avoid trusting a judge?</summary>
        <div class="ans">It's a two-pass check. First a deterministic pass asks whether the exact quote or number appears in the fetched source — that part is a computation, not a guess. Claims that don't literally match go to a strict judgment pass where the model reads the actual source text and answers only "does this passage support the claim as written?" — never from memory, and never by rewriting the claim. So a model does judge, but it's bound to the source text, not free to improvise.</div>
      </details>
      <details>
        <summary>Can I host my own?</summary>
        <div class="ans">It already runs client-side — the skill and its two helper scripts live in the repo (<span class="mono">github.com/0x06cf/proofworks</span>), so your agent runs the whole loop on your own machine and your own model. Your research never leaves your machine.</div>
      </details>
    </div>
  </div>
</section>

<!-- Resources (agent + machine files, presented readably) -->
<section class="res" id="resources">
  <div class="container">
    <div class="kicker">Resources</div>
    <h2 class="serif">Agent files and specs</h2>
    <p class="res-sub">These <b>machine formats</b> are for agents and scripts, not human reading, so each opens as raw text or JSON. Below is what each one is for.</p>
    <div class="res-grid">
      <a class="res-card" href="${ORIGIN}/agent-setup/prompt.md">
        <div class="rt">SETUP</div><h3>Setup prompt</h3>
        <p>The skill in one paste-able line. Any agent fetches it and adopts the verify-and-backfill loop. Markdown.</p>
        <span class="mono">/agent-setup/prompt.md</span>
      </a>
      <a class="res-card" href="https://github.com/0x06cf/proofworks" target="_blank" rel="noopener">
        <div class="rt">SKILL</div><h3>Source + skill</h3>
        <p>The full skill: SKILL.md, the loop protocol, and the fetch + presence-check helper scripts. Open source.</p>
        <span class="mono">github.com/0x06cf/proofworks</span>
      </a>
      <a class="res-card" href="${ORIGIN}/llms.txt">
        <div class="rt">LLMS</div><h3>llms.txt</h3>
        <p>AI content signal; a map of the skill for agent crawlers. Plain text.</p>
        <span class="mono">/llms.txt</span>
      </a>
      <a class="res-card" href="${ORIGIN}/robots.txt">
        <div class="rt">SPEC</div><h3>robots.txt</h3>
        <p>Crawler policy: what indexers may read and cite. Plain text.</p>
        <span class="mono">/robots.txt</span>
      </a>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="foot-grid">
    <div>
      <h4>Product</h4>
      <ul><li><a href="${ORIGIN}/agent-setup/prompt.md">Setup prompt</a></li><li><a href="#offer">The ladder</a></li><li><a href="#demo">Demo</a></li><li><a href="${ORIGIN}/llms.txt">llms.txt</a></li></ul>
    </div>
    <div>
      <h4>Developers</h4>
      <ul><li><a href="https://github.com/0x06cf/proofworks" target="_blank" rel="noopener">Source + skill</a></li><li><a href="#use-cases">Use cases</a></li><li><a href="#integrations">Agent setup</a></li><li><a href="#faq">FAQ</a></li></ul>
    </div>
    <div>
      <h4>Specs</h4>
      <ul><li><a href="${ORIGIN}/robots.txt">robots.txt</a></li><li><a href="${ORIGIN}/sitemap.xml">sitemap.xml</a></li><li><a href="${ORIGIN}/.well-known/ai-access">ai-access</a></li><li><a href="https://github.com/0x06cf/proofworks" target="_blank" rel="noopener">license</a></li></ul>
    </div>
    <div>
      <h4>Meta</h4>
      <ul><li><a href="${ORIGIN}/agent-setup/prompt.md">Setup prompt</a></li><li><a href="https://github.com/0x06cf/proofworks" target="_blank" rel="noopener">GitHub</a></li><li><a href="${ORIGIN}/llms.txt">llms.txt</a></li></ul>
    </div>
  </div>
  <div class="foot-bottom">
    <span>© 2026 <a class="brand" href="${ORIGIN}/"><span class="mark">✓</span>Proofworks</a></span>
    <span class="legal-note">open source · MIT · runs locally on your agent</span>
    <div class="legal"><a href="#offer">About</a><a href="#faq">FAQ</a><a href="https://github.com/0x06cf/proofworks" target="_blank" rel="noopener">GitHub</a></div>
  </div>
</footer>

<script>
(function(){
  var ORIG='${ORIGIN}';

  // ---- copy the skill setup prompt ----
  var skillBtn=document.getElementById('copySkill');
  if(skillBtn)skillBtn.addEventListener('click',function(){
    var txt=document.getElementById('skillPrompt').textContent.trim();
    navigator.clipboard.writeText(txt).then(function(){
      var b=this; b.textContent='Copied ✓'; setTimeout(function(){b.textContent='Copy';},1200);
    }.bind(this)).catch(function(){});
  });
})();
</script>
</body>
</html>`;

export async function handleUi(req: Request, _env: unknown, url: URL): Promise<Response> {
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(LANDING, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  return new Response('Not Found', { status: 404 });
}