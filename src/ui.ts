// ui.ts
// Proofworks — deterministic verification oracle, MCP-first.
// `/` serves a full marketing landing (hero + live verdict demo + offer +
// integrations + use cases + FAQ + CTA). No SPA, no human-verification jury.
// Visual system: Vercel-style precision (Geist, shadow-as-border, #171717/#fff)
// with a "verdict/proof" accent set: certain=green, source-backed=blue,
// unverifiable=gray. Mono voice for verdicts and code.

export const ORIGIN = 'https://sentrylab.app';
const CF_UA = 'Proofworks/0.2 (oracle; contact: none)';

const LANDING = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Proofworks is an MCP server, a deterministic verification oracle. Connect your AI agent, then check claims it makes: computed, matched to sources, or admitted unverifiable.">
<link rel="canonical" href="${ORIGIN}/">
<meta property="og:type" content="website">
<meta property="og:url" content="${ORIGIN}/">
<meta property="og:title" content="Proofworks — let your agent prove it">
<meta property="og:description" content="An MCP server that verifies claims deterministically. certain · source-backed · unverifiable. Never a fake yes.">
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
.demo-input{width:100%;font-size:15px;border:1px solid var(--line);border-radius:8px;padding:12px 14px;font-family:'Geist Mono',monospace;color:var(--ink);resize:vertical;min-height:64px;outline:none;background:#fbfbfb}
.demo-input:focus{border-color:var(--source);box-shadow:0 0 0 3px rgba(10,114,239,.12)}
.demo-run{margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.spin{width:14px;height:14px;border:2px solid var(--line);border-top-color:var(--ink);border-radius:50%;animation:rot .7s linear infinite;display:none}
@keyframes rot{to{transform:rotate(360deg)}}
.demo-out{margin-top:16px;display:none;flex-direction:column;gap:8px}
.verdict{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:9px;background:#fbfbfb;box-shadow:var(--line) 0 0 0 1px}
.verdict .sym{font-family:'Geist Mono',monospace;font-weight:600;font-size:15px;line-height:1.4;width:20px;text-align:center}
.verdict .txt{flex:1;font-size:14px;line-height:1.45;color:var(--ink)}
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
.int-row{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.agent-list{display:flex;flex-wrap:wrap;gap:10px}
.agent-pill{display:inline-flex;align-items:center;gap:8px;font-family:'Geist Mono',monospace;font-size:13.5px;font-weight:500;padding:9px 14px;border-radius:8px;box-shadow:var(--ring) 0 0 0 1px;background:#fff;cursor:pointer;transition:all .12s}
.agent-pill .square{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:5px;font-size:11px;background:var(--ink);color:#fff}
.agent-pill:hover{box-shadow:var(--ring) 0 0 0 1px, rgba(0,0,0,.05) 0 3px 12px -4px}
.agent-pill.active{border-color:transparent;box-shadow:0 0 0 2px var(--source)}
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

/* ---------- FAQ ---------- */
.faq{max-width:720px;margin:0 auto}
.faq details{border-bottom:1px solid var(--line);padding:4px 0}
.faq summary{list-style:none;cursor:pointer;padding:18px 0;font-size:16.5px;font-weight:500;display:flex;justify-content:space-between;align-items:center;gap:16px}
.faq summary::after{content:'+';font-family:'Geist Mono',monospace;font-size:19px;color:var(--ink3);font-weight:400;transition:transform .15s}
.faq details[open] summary::after{content:'−'}
.faq .ans{padding:0 0 20px;color:var(--ink2);font-size:15px;line-height:1.65}

/* ---------- CTA + footer ---------- */
.cta-band{background:#0b0d10;color:#fff;text-align:center;padding:96px 24px;position:relative;overflow:hidden}
.cta-band::before{content:'';position:absolute;inset:auto 0 0 0;height:220px;background:radial-gradient(560px 200px at 50% 100%, rgba(10,114,239,.18), transparent 70%)}
.cta-band h2{color:#fff;font-size:clamp(30px,5vw,48px);letter-spacing:-.03em}
.cta-band p{color:#a4adb8;max-width:520px;margin:16px auto 30px;font-size:17px}
.cta-band .btn{background:#fff;color:var(--ink)}
.cta-band .btn.ghost{background:transparent;color:#fff;box-shadow:0 0 0 1px #2a313a}
.cta-band .btn.ghost:hover{background:#151a20}
.cta-band pre{max-width:560px;margin:0 auto;text-align:left;background:#0f1216;border:1px solid #1f262e;border-radius:10px;padding:14px 16px;font-size:12.5px;color:#a4adb8;line-height:1.6;overflow-x:auto}
.cta-band .status{margin-top:26px;font-family:'Geist Mono',monospace;font-size:12.5px;color:#8f99a4;display:flex;justify-content:center;gap:8px;align-items:center;flex-wrap:wrap}
.cta-band .status .dot{width:7px;height:7px;border-radius:50%;background:var(--certain);display:inline-block;margin-right:4px}
footer{padding:60px 0 40px;background:#fff;border-top:1px solid var(--line)}
.foot-grid{max-width:1120px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1.6fr repeat(4,1fr);gap:32px}
footer h4{font-size:13px;font-weight:600;letter-spacing:.02em;margin-bottom:14px}
footer ul{list-style:none}
footer li{margin-bottom:10px}
footer a{color:var(--ink2);font-size:14px}
footer a:hover{color:var(--ink)}
.foot-brand .brand{margin-bottom:12px}
.foot-brand p{color:var(--ink3);font-size:13.5px;max-width:240px;line-height:1.55}
.foot-bottom{max-width:1120px;margin:26px auto 0;padding:20px 24px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;color:var(--ink3);font-size:13px}
.foot-bottom .legal{display:flex;gap:20px}
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
<div class="topbar"><div class="topbar-inner"><span class="dot"></span>Proofworks is live as a public MCP server. <a href="${ORIGIN}/agent-setup/prompt.md">Onboard your agent →</a></div></div>

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
      <a href="${ORIGIN}/llms.txt">Resources</a>
    </div>
    <div class="nav-cta">
      <a class="btn ghost" href="${ORIGIN}/openapi.json">Docs</a>
      <a class="btn" href="#install">Onboard an agent</a>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero" style="padding-top:64px">
  <div class="container">
    <div class="kicker"><span>oracle</span> · <b>deterministic</b> · <span>MCP server</span></div>
    <h1>Don't let the agent <span class="strike">guess</span><br>make it <span class="ok">prove</span> the claim.</h1>
    <p class="hero-sub">Proofworks is the verification endpoint for AI agents. Connect it over MCP, then check any claim the model makes. <a href="#offer">Arithmetic and dates are computed</a>. Everything else is matched to a source. What can't be proven is marked <b class="mono" style="color:var(--unver)">unverifiable</b>, not passed off as fact.</p>
    <div class="hero-cta">
      <a class="btn" href="#install">Onboard your agent</a>
      <a class="btn ghost" href="#demo" id="tryInline">Try the oracle</a>
      <div class="note">No signup, no credit card, no auth. Public server.</div>
    </div>

    <!-- live verdict demo -->
    <div class="demo" id="demo">
      <div class="demo-card">
        <div class="demo-head">
          <span class="cir"></span><span class="cir"></span><span class="cir"></span>
          <span class="title">proofworks — live oracle</span>
        </div>
        <div class="demo-body">
          <textarea class="demo-input" id="demoInput" spellcheck="false">January 1 2027 is a Monday. 15% of 1200 is 180. The Eiffel Tower is in Miami.</textarea>
          <div class="demo-run">
            <button class="btn" id="demoBtn">Verify</button>
            <span class="spin" id="demoSpin"></span>
          </div>
          <div class="demo-out" id="demoOut"></div>
        </div>
      </div>
      <div class="demo-hint">Runs on the live API. <button id="demoLoad">load a sample</button> or type a sentence with a number, a date, or a citation target.</div>
    </div>
  </div>
</section>

<!-- OFFER: confidence ladder -->
<section id="offer">
  <div class="container">
    <div class="sec-head">
      <div class="eyebrow">What we offer</div>
      <h2>Every verdict states how it was reached</h2>
      <p>The point isn't only to say "true" or "false". The point is to say <em>why</em>, and to refuse to guess when it can't.</p>
    </div>
    <div class="offer-grid">
      <div class="offer-card oc-certain">
        <span class="lvl">Certain · computed</span>
        <h3>Deterministic math</h3>
        <p>Arithmetic, percentages, and day-of-week are computed exactly. A wrong answer isn't rated, it's refuted.</p>
        <div class="eg">"15% of 1200 is 200"<br><span class="no">✗ refuted</span> · 180</div>
      </div>
      <div class="offer-card oc-source">
        <span class="lvl">Source-backed · matched</span>
        <h3>Checked against sources</h3>
        <p>Claims that aren't computable are matched against a real citation. You get the verdict and the passage it rests on.</p>
        <div class="eg">"Workers has a free tier"<br><span class="ok">✓ supported</span> + source</div>
      </div>
      <div class="offer-card oc-unver">
        <span class="lvl">Unverifiable · refused</span>
        <h3>It won't fake confidence</h3>
        <p>No source, no computation, no claim. The honest answer is <b>unverifiable</b>, never a confident guess.</p>
        <div class="eg">"The Eiffel Tower is in Miami"<br><span class="no">— unverifiable</span>, no source</div>
      </div>
    </div>
  </div>
</section>

<!-- INTEGRATIONS -->
<section class="alt" id="integrations">
  <div class="container">
    <div class="sec-head">
      <div class="eyebrow">Integrations</div>
      <h2>Connect your agent in one line</h2>
      <p>Proofworks speaks MCP, so it drops into whatever agent you already use. Pick yours to get the exact snippet.</p>
    </div>
    <div class="int-row">
      <div class="agent-list" id="agentList">
        <div class="agent-pill active" data-agent="claude"><span class="square">C</span>Claude Code</div>
        <div class="agent-pill" data-agent="codex"><span class="square">X</span>Codex</div>
        <div class="agent-pill" data-agent="opencode"><span class="square">O</span>OpenCode</div>
        <div class="agent-pill" data-agent="windsurf"><span class="square">W</span>Windsurf</div>
        <div class="agent-pill" data-agent="cursor"><span class="square">\"</span>Cursor</div>
      </div>
      <div>
        <div class="install-box">
          <div class="install-bar"><span id="agentName">claude code</span><button id="copyInstall">Copy</button></div>
          <pre class="code" id="installCode"></pre>
        </div>
        <div class="int-note">Prefer the agent to install itself? <a href="${ORIGIN}/agent-setup/prompt.md">Use the setup prompt →</a></div>
      </div>
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
      <div class="num"><span class="big green">0</span><p>LLMs grading your LLM. Every verdict is a computation or a match, never an opinion.</p></div>
      <div class="num"><span class="big blue">∞</span><p>Claims it will verify. Add arithmetic, dates, and source citations and it just answers.</p></div>
      <div class="num"><span class="big">1</span><p>Line to install. An MCP config entry, or a single setup prompt if you'd rather.</p></div>
      <div class="num"><span class="big">$0</span><p>Cost to start. Public server, no pricing, no account. Free for agents.</p></div>
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
        <p>Agents miss decimals, flip signs, round oddly. Run the figure through claim_check before you trust it in an answer or a dashboard.</p>
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
        <p>A downstream agent calls claim_check on an upstream agent's output. Verification becomes a step in the pipeline, not a hope.</p>
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
        <h2>An oracle can't hallucinate a verdict</h2>
        <p class="sub">The whole design rests on a rule: <b>no LLM grades the answer.</b> A computation either computes or it doesn't. A source either matches or it doesn't. When neither applies, the oracle says so. That constraint is what makes the verdict trustworthy at all.</p>
        <div class="ladder">
          <div class="row"><span class="tag ok mono">certain</span><span>computed from the claim itself</span></div>
          <div class="row"><span class="tag zz mono">source-backed</span><span>matched to a real citation</span></div>
          <div class="row"><span class="tag no mono">unverifiable</span><span>honest refusal to guess</span></div>
        </div>
      </div>
      <div class="codecol">
        <pre><span class="cm" style="color:#5b6470">// claim_check — the core tool</span>
BODY  <span class="st" style="color:#85d39d">{"claim": "Jan 1 2027 is a Monday"}</span>
      <span class="fn" style="color:#f0a0a0">{"source_url": null}</span>

<span style="color:#79b8ff">RESP</span>  <span class="st" style="color:#85d39d">{"verdict": "refuted",</span>
      <span class="st" style="color:#85d39d"> "confidence": "certain",</span>
      <span class="st" style="color:#85d39d"> "computed": {"result": "friday",</span>
      <span class="st" style="color:#85d39d">              "claimed": "monday"}}</span></pre>
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
        <div class="ans">It verifies claims along three paths. Arithmetic, percentages, and day-of-week are computed directly (the <b class="mono">certain</b> tier). Claims that aren't computable are matched against sources you pass in (the <b class="mono">source-backed</b> tier). When neither applies, it returns <b class="mono">unverifiable</b> rather than invent a result.</div>
      </details>
      <details>
        <summary>Which agents can use it?</summary>
        <div class="ans">Anything that speaks MCP over HTTP, which covers Claude Code, Codex, OpenCode, Windsurf, Cursor, GitHub Copilot, and a custom agent via the REST endpoints. The setup prompt at <span class="mono">/agent-setup/prompt.md</span> walks an agent through connecting itself.</div>
      </details>
      <details>
        <summary>Is it a paid service? Is there a free tier?</summary>
        <div class="ans">It's a free public server, no account and no pricing. The goal is to be a neutral verification layer that any agent can reach, the way it reaches the network.</div>
      </details>
      <details>
        <summary>Why is "no LLM in the loop" the point?</summary>
        <div class="ans">If an LLM graded another LLM's work, you'd be trusting a model to judge a model, and your confidence would scale on faith. A deterministic oracle removes that: the verdict is reproducible and inspectable. It can be wrong only in the way a computation or a bad source can be wrong, never in the way a confident guess is.</div>
      </details>
      <details>
        <summary>Can I host my own?</summary>
        <div class="ans">Yes. It's a Cloudflare Worker (TypeScript, D1 + KV) and the source is open in the repo. Point the same MCP endpoints at your own deployment and keep all traffic on your infra.</div>
      </details>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-band" id="install">
  <h2>Give your agent a referee.</h2>
  <p>Paste the setup prompt into any agent chat. It connects itself, then starts verifying.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative;z-index:2">
    <a class="btn" href="${ORIGIN}/agent-setup/prompt.md">Read the setup prompt</a>
    <a class="btn ghost" href="https://github.com/0x06cf/proofworks" target="_blank" rel="noopener">View the repo</a>
  </div>
  <pre>&lt;paste this into your agent&gt;<br>Fetch and execute the setup instructions for the<br>Proofworks MCP server from @url:\`${ORIGIN}/agent-setup/prompt.md\`</pre>
  <div class="status"><span class="dot"></span>all systems online&nbsp;·&nbsp;no auth&nbsp;·&nbsp;SOC&#8209;2 ready on request</div>
</section>

<!-- FOOTER -->
<footer>
  <div class="foot-grid">
    <div class="foot-brand">
      <a class="brand" href="${ORIGIN}/"><span class="mark">✓</span>Proofworks</a>
      <p>A deterministic verification oracle. Let your agent prove it.</p>
    </div>
    <div>
      <h4>Product</h4>
      <ul><li><a href="${ORIGIN}/agent-setup/prompt.md">Setup prompt</a></li><li><a href="#offer">The ladder</a></li><li><a href="${ORIGIN}/openapi.json">Docs</a></li><li><a href="${ORIGIN}/llms.txt">llms.txt</a></li></ul>
    </div>
    <div>
      <h4>Developers</h4>
      <ul><li><a href="${ORIGIN}/openapi.json">OpenAPI</a></li><li><a href="${ORIGIN}/mcp.json">MCP manifest</a></li><li><a href="#use-cases">Use cases</a></li><li><a href="#integrations">Agent setup</a></li></ul>
    </div>
    <div>
      <h4>Specs</h4>
      <ul><li><a href="${ORIGIN}/robots.txt">robots.txt</a></li><li><a href="${ORIGIN}/sitemap.xml">sitemap.xml</a></li><li><a href="${ORIGIN}/.well-known/ai-access">ai-access</a></li><li><a href="${ORIGIN}/.well-known/mcp.json">mcp.json</a></li></ul>
    </div>
    <div>
      <h4>Meta</h4>
      <ul><li><a href="https://github.com/0x06cf/proofworks" target="_blank" rel="noopener">GitHub</a></li><li><a href="#">Stay in the loop</a></li></ul>
    </div>
  </div>
  <div class="foot-bottom">
    <span>© 2026 Proofworks. All rights reserved.</span>
    <div class="legal"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Status</a></div>
  </div>
</footer>

<script>
(function(){
  var ORIG='${ORIGIN}';

  // ---- agent install snippets ----
  var installs={
    claude:{name:'claude code',code:
'# Install via MCP (HTTP)\nclaude mcp add --transport http proofworks ${ORIGIN}/mcp\n'+
'# Restart Claude Code, then: "verify 15% of 1200"\n'},
    codex:{name:'codex',code:
'# Add the server once\ncodex mcp add proofworks --url ${ORIGIN}/mcp\n'+
'# Then in a session: claim_check is available automatically\n'},
    opencode:{name:'opencode',code:
'// ~/.config/opencode/opencode.jsonc  →  "mcp": {\n"proofworks": {\n  "type": "remote",\n  "url": "${ORIGIN}/mcp",\n  "enabled": true\n}\n// }'},
    windsurf:{name:'windsurf',code:
'// ~/.codeium/windsurf/mcp_config.json  →  "mcpServers": {\n"proofworks": {\n  "serverUrl": "${ORIGIN}/mcp"\n}\n// }'},
    cursor:{name:'cursor',code:
'// .cursor/mcp.json  →  "mcpServers": {\n"proofworks": {\n  "url": "${ORIGIN}/mcp"\n}\n// }'}
  };

  var cur='claude';
  function renderInstall(){
    var a=installs[cur];
    document.getElementById('agentName').textContent=a.name;
    document.getElementById('installCode').textContent=a.code;
    var pills=document.querySelectorAll('.agent-pill');
    pills.forEach(function(p){p.classList.toggle('active',p.dataset.agent===cur);});
  }
  document.getElementById('agentList').addEventListener('click',function(e){
    var p=e.target.closest('.agent-pill'); if(!p) return;
    cur=p.dataset.agent; renderInstall();
  });
  document.getElementById('copyInstall').addEventListener('click',function(){
    var txt=installs[cur].code; navigator.clipboard.writeText(txt).then(function(){
      var b=this; b.textContent='Copied ✓'; setTimeout(function(){b.textContent='Copy';},1200);
    }.bind(this)).catch(function(){});
  });

  // ---- live verdict demo ----
  var samples=["January 1 2027 is a Monday. 15% of 1200 is 180. The Eiffel Tower is in Miami.","2.5 * 40 equals 90.","64 divided by 8 is 8. December 25 2027 is a Saturday."];
  var si=0,demoBtn=document.getElementById('demoBtn'),demoIn=document.getElementById('demoInput'),demoOut=document.getElementById('demoOut'),spin=document.getElementById('demoSpin');

  document.getElementById('demoLoad').addEventListener('click',function(){ demoIn.value=samples[si++%samples.length]; });

  function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  function parts(text){return text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/).map(s=>s.trim()).filter(Boolean);}

  function symFor(v){return v==='confirmed'?'✓':(v==='refuted'?'✗':v==='no_source'||v==='unverifiable'?'—':v==='partial'?'~':'✓');}
  function clsFor(v){
    if(v==='refuted')return 'v-refuted';
    if(v==='confirmed'||v==='unsupported')return v==='unsupported'?'v-unver':(v==='confirmed'?'v-certain':'v-unver');
    if(v==='supported'||v==='partial')return 'v-source';
    return 'v-unver';
  }
  function tagFor(v){
    var map={'confirmed':'certain','refuted':'refuted','supported':'source-backed','partial':'source-backed','no_source':'unverifiable','unverifiable':'unverifiable','unsupported':'unverifiable'};
    return map[v]||v;
  }

  function runDemo(cb){
    spin.style.display='inline-block'; demoBtn.disabled=true;
    fetch(ORIG+'/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ai_text:demoIn.value,sources:[]})})
      .then(function(r){return r.json();})
      .then(function(d){
        var rows=(d.claims||[]).map(function(c){
          var sym=symFor(c.verdict),cl=clsFor(c.verdict),tag=tagFor(c.verdict);
          var extra='';
          if(c.computed&&c.computed.result)extra=' — '+esc(String(c.computed.result));
          if(c.source_url)extra=' · <a href="'+esc(c.source_url)+'" target="_blank" rel="noopener">source</a>';
          return '<div class="verdict '+cl+'"><span class="sym">'+sym+'</span><span class="txt">'+esc(c.claim_text)+extra+'</span><span class="tag">'+tag+'</span></div>';
        }).join('');
        demoOut.style.display=(rows?'flex':'none');
        demoOut.innerHTML=rows||'<div class="verdict v-unver"><span class="sym">—</span><span class="txt">No checkable claims in that text.</span><span class="tag">empty</span></div>';
        if(cb)cb();
      })
      .catch(function(){
        demoOut.style.display='flex';
        demoOut.innerHTML='<div class="verdict v-unver"><span class="sym">!</span><span class="txt">Could not reach the oracle.</span><span class="tag">error</span></div>';
        if(cb)cb();
      });
  }
  demoBtn.addEventListener('click',function(){runDemo(function(){spin.style.display='none';demoBtn.disabled=false;});});
  demoIn.addEventListener('keydown',function(e){if((e.key==='Enter'&&e.metaKey)||(e.key==='Enter'&&e.ctrlKey)){demoBtn.click();}});

  // run once on load if text present
  if(demoIn.value.trim()){runDemo(function(){spin.style.display='none';demoBtn.disabled=false;});}
})();
</script>
</body>
</html>`;

import type { Env } from './db';

export async function handleUi(req: Request, env: Env, url: URL): Promise<Response> {
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(LANDING, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  return json({ error: 'not found' }, 404);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}