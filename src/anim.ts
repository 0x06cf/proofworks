// anim.ts
// Proofworks landing motion layer - served at /anim.css and /anim.js.
// Kept as standalone static assets so the animation code stays out of the
// fragile LANDING template literal in ui.ts (no `\n` / backtick hazards here).
// Both bundles are verified safe for template-literal embedding: no backticks,
// no ${ sequences.

export const ANIM_CSS = `
/* Proofworks landing — motion layer (/anim.css)
 * Scroll reveals, hero parallax zoom, cursor spotlight, magnetic buttons,
 * card lifts, judgement-chip float. Disciplined, respects prefers-reduced-motion.
 * Loaded from the Worker as a static asset so it stays out of the fragile
 * LANDING template literal. */

:root{
  --reveal-ease:cubic-bezier(.16,1,.3,1);
  --dur: .7s;
}

@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
}

/* ---------- scroll progress indicator ---------- */
.pw-progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:100;
  background:linear-gradient(90deg,var(--certain),var(--source));
  box-shadow:0 0 12px rgba(18,128,92,.5)}

/* ---------- hero entrance (stagger) ---------- */
.pw-hero .pw-rise{opacity:0;transform:translateY(22px);
  transition:opacity var(--dur) var(--reveal-ease),transform var(--dur) var(--reveal-ease)}
.pw-hero.pw-load .pw-rise{opacity:1;transform:none}
.pw-rise:nth-child(1){transition-delay:.05s}
.pw-rise:nth-child(2){transition-delay:.14s}
.pw-rise:nth-child(3){transition-delay:.23s}
.pw-rise:nth-child(4){transition-delay:.32s}
.pw-rise:nth-child(5){transition-delay:.42s}

/* ---------- scroll reveal ---------- */
.pw-reveal{opacity:0;transform:translateY(28px) scale(.985);
  transition:opacity .8s var(--reveal-ease),transform .8s var(--reveal-ease),box-shadow .3s ease}
.pw-reveal.pw-in{opacity:1;transform:none}
.pw-reveal[data-dir="left"]{transform:translateX(-34px);opacity:0}
.pw-reveal[data-dir="left"].pw-in{transform:none;opacity:1}
.pw-reveal[data-dir="right"]{transform:translateX(34px);opacity:0}
.pw-reveal[data-dir="right"].pw-in{transform:none;opacity:1}
.pw-reveal[data-dir="zoom"]{transform:scale(.92);opacity:0}
.pw-reveal[data-dir="zoom"].pw-in{transform:none;opacity:1}
.pw-reveal[data-stagger]{transition-delay:calc(var(--i,0)*.08s)}

/* ---------- hero cursor spotlight ---------- */
.pw-spotlight{position:fixed;width:520px;height:520px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(10,114,239,.10),transparent 62%);
  transform:translate(-50%,-50%);z-index:1;mix-blend-mode:multiply;
  transition:opacity .4s ease}

/* ---------- magnetic buttons ---------- */
.pw-mag{transition:transform .18s cubic-bezier(.2,.9,.3,1.2)}

/* ---------- card hover lift + border glow ---------- */
.pw-lift{transition:transform .35s var(--reveal-ease),box-shadow .35s var(--reveal-ease),border-color .35s ease}
.pw-lift:hover{transform:translateY(-4px);box-shadow:0 16px 40px -18px rgba(10,114,239,.28),var(--ring) 0 0 0 1px}

/* ---------- headline accent glow-pulse (subtle life on a colored word) ---------- */
.pw-shimmer{animation:pw-pulse 3s ease-in-out infinite}
@keyframes pw-pulse{0%,100%{text-shadow:0 0 0 rgba(18,128,92,0)}50%{text-shadow:0 0 18px rgba(18,128,92,.45)}}

/* ---------- judgement-chip float (subtle life) ---------- */
.pw-float{animation:pw-float 5s ease-in-out infinite}
.pw-float:nth-child(2){animation-delay:.4s}
.pw-float:nth-child(3){animation-delay:.8s}
@keyframes pw-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

/* ---------- paragraph gradient fade-in ---------- */
.pw-fade{background:#fff}
.pw-fade.pw-in{animation:pw-fadeup .7s var(--reveal-ease)}

@keyframes pw-fadeup{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:none}}

/* scroll-driven hero zoom: the demo/hero block scales 1 -> 1.04 as user scrolls the first viewport */
.pw-hero-zoom{will-change:transform}

/* slow drift on the demo rows to feel "alive" but not distracting */
@media (prefers-reduced-motion:no-preference){
  .demo-card:hover .pw-float{animation-duration:2.6s}
}
`;

export const ANIM_JS = `
/* Proofworks landing — motion controller (/anim.js)
 * Drives the classes/transforms that animation.css reads.
 * - scroll progress bar
 * - IntersectionObserver reveals
 * - hero scroll-zoom (scale the hero inner block 1 -> 1.04 over first viewport)
 * - cursor spotlight in hero
 * - magnetic buttons
 * Ships as a static Worker asset. Disabled under prefers-reduced-motion.
 */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // reduced motion: do nothing, CSS kills transitions anyway

  /* ---- scroll progress ---- */
  var prog = document.createElement('div');
  prog.className = 'pw-progress';
  document.body.appendChild(prog);
  function updateProg(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop / max) : 0;
    prog.style.width = (p * 100).toFixed(2) + '%';
  }

  /* ---- hero scroll-zoom: scale .pw-hero-zoom from 1 -> 1.05 through first viewport ---- */
  var heroZoom = document.querySelector('.pw-hero-zoom');
  function updateZoom(){
    if (!heroZoom) return;
    var r = heroZoom.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress through the first ~100vh of scroll (top of hero exiting)
    var t = Math.min(Math.max(-r.top / vh, 0), 1);
    var s = 1 + t * 0.05;
    heroZoom.style.transform = 'scale(' + s.toFixed(3) + ')';
    heroZoom.style.opacity = (1 - t * 0.12).toFixed(3);
  }

  function onScroll(){
    updateProg();
    if (window.requestAnimationFrame){ requestAnimationFrame(updateZoom); }
    else { updateZoom(); }
    if (typeof sweep === 'function') sweep();
  }

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll('.pw-reveal');
  var pendingReveals = [].slice.call(reveals);
  function forceVisible(el){
    if (el.classList.contains('pw-in')) return;
    var d = el.getAttribute && el.getAttribute('data-delay');
    if (d) el.style.transitionDelay = d;
    el.classList.add('pw-in');
    io && io.unobserve(el);
    var i = pendingReveals.indexOf(el);
    if (i > -1) pendingReveals.splice(i, 1);
  }
  var io = null;
  if ('IntersectionObserver' in window && reveals.length){
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) forceVisible(e.target); });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    reveals.forEach(function(el){ io.observe(el); });
  } else if (reveals.length){
    reveals.forEach(function(el){ el.classList.add('pw-in'); }); // no IO: just show
  }
  // safety sweep: any reveal at/above the viewport bottom must never stay hidden,
  // so content in the last screenful (or jumped-past) can't be stuck at opacity:0
  function sweep(){
    var vh = window.innerHeight;
    for (var i = pendingReveals.length - 1; i >= 0; i--){
      var el = pendingReveals[i];
      var r = el.getBoundingClientRect();
      // reveal if the element is at-or-above the current viewport bottom (visible OR already scrolled past)
      if (r.top < vh + 8) forceVisible(el);
    }
  }

  /* ---- hero entrance: add .pw-load after mount so the stagger plays ---- */
  var hero = document.querySelector('.pw-hero.pw-loadable');
  if (hero){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ hero.classList.add('pw-load'); }); }); }
  else {
    // fallback: any .pw-rise immediately
    document.querySelectorAll('.pw-hero .pw-rise').forEach(function(el, i){
      el.style.transitionDelay = (0.05 + i * 0.09) + 's';
      el.classList.add('pw-load'); // force visible if .pw-loadable absent (class toggles handled in CSS via parent .pw-load)
    });
  }
  // if parent never gets .pw-load, reveal the rises anyway after a beat
  setTimeout(function(){
    if (hero && !hero.classList.contains('pw-load')){
      document.querySelectorAll('.pw-hero .pw-rise').forEach(function(el){ el.classList.add('pw-load'); });
    }
  }, 1400);

  /* ---- cursor spotlight (hero only, cheap) ---- */
  var spot = document.querySelector('.pw-spotlight');
  if (spot && window.matchMedia('(pointer:fine)').matches){
    var sx = innerWidth/2, sy = innerHeight*0.2;
    window.addEventListener('mousemove', function(e){
      sx = e.clientX; sy = e.clientY;
    }, { passive: true });
    (function spotLoop(){
      spot.style.left = sx + 'px';
      spot.style.top = sy + 'px';
      requestAnimationFrame(spotLoop);
    })();
  } else if (spot){ spot.style.display = 'none'; }

  /* ---- magnetic buttons ---- */
  var mags = document.querySelectorAll('.pw-mag');
  if (mags.length && window.matchMedia('(pointer:fine)').matches){
    mags.forEach(function(btn){
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width/2);
        var y = e.clientY - (r.top + r.height/2);
        btn.style.transform = 'translate('+(x*0.18).toFixed(1)+'px,'+(y*0.28).toFixed(1)+'px)';
      });
      btn.addEventListener('mouseleave', function(){ btn.style.transform = ''; });
    });
  }

  var raf = false;
  window.addEventListener('scroll', function(){
    if (!raf){ raf = true; requestAnimationFrame(function(){ onScroll(); raf = false; }); }
  }, { passive: true });
  onScroll();
})();
`;


export const GLASS_CSS = `
/* Proofworks landing - iOS 26 Liquid Glass layer (/glass.css)
 * Frosted translucent panels, rim-light borders, specular sheen, over a subtle
 * ambient aurora so the blur reads as glass. Loaded after ui.ts <style> so it
 * overrides the flat white cards. Kept in anim.ts as GLASS_CSS (safe template
 * literal, no escaping hazards). Respects prefers-reduced-motion.
 */

/* ---------- 1. ambient aurora backdrop (what the glass blurs) ---------- */
/* Rendered as a real fixed-position element (like pw-spotlight) so it paints
   reliably in every renderer — CSS backgrounds on html/body were unreliable. */
.glass-on .pw-aurora{
  position:fixed; inset:0; z-index:-1; pointer-events:none;
  background:
    radial-gradient(55% 45% at 14% 6%,   rgba(10,114,239,.13), transparent 68%),
    radial-gradient(48% 42% at 86% 12%,  rgba(18,128,92,.15), transparent 68%),
    radial-gradient(62% 52% at 50% 100%, rgba(122,128,255,.11), transparent 70%);
  background-color:#eef2f7;
}
.glass-on body{
  position:relative;            /* establish stacking context so the -1 aurora stays behind content */
  background:transparent !important;
}

/* ---------- 2. frosted glass surface (light) ---------- */
.glass-on .offer-card,
.glass-on .num,
.glass-on .uc-card:not(.ucdark),
.glass-on .res-card,
.glass-on .demo-card{
  background:linear-gradient(180deg, rgba(255,255,255,.62), rgba(255,255,255,.32));
  backdrop-filter:blur(18px) saturate(165%);
  -webkit-backdrop-filter:blur(18px) saturate(165%);
  border:1px solid rgba(255,255,255,.55);
  border-top-color:rgba(255,255,255,.9);
  box-shadow:
    0 1px 0 rgba(255,255,255,.7) inset,
    0 1px 2px rgba(20,30,50,.04),
    0 12px 34px -16px rgba(20,30,60,.28);
  position:relative;
  border-radius:18px;
}
/* specular sheen - diagonal glass reflection across each surface */
.glass-on .offer-card::after,
.glass-on .num::after,
.glass-on .uc-card:not(.ucdark)::after,
.glass-on .res-card::after,
.glass-on .demo-card::after{
  content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  background:linear-gradient(118deg, rgba(255,255,255,.42) 0%, rgba(255,255,255,.05) 34%, transparent 46%);
  mix-blend-mode:screen;
}

/* lift + glow on hover stays, but on the glass surface */
.glass-on .pw-lift:hover{ box-shadow:0 22px 50px -20px rgba(10,60,140,.35), 0 1px 0 rgba(255,255,255,.75) inset; }

/* ---------- 3. dark glass (terminal-like surfaces) ---------- */
.glass-on .uc-card.ucdark,
.glass-on .codecol,
.glass-on .install-box{
  background:linear-gradient(180deg, rgba(22,26,32,.72), rgba(14,16,20,.85));
  backdrop-filter:blur(20px) saturate(140%);
  -webkit-backdrop-filter:blur(20px) saturate(140%);
  border:1px solid rgba(255,255,255,.14);
  border-top-color:rgba(255,255,255,.28);
  box-shadow:0 1px 0 rgba(255,255,255,.18) inset, 0 24px 70px -40px rgba(0,0,0,.65);
  position:relative;
  border-radius:18px;
}
.glass-on .install-bar{ background:rgba(20,23,28,.55); }

/* ---------- 4. nav glass ---------- */
.glass-on nav{
  background:rgba(255,255,255,.5);
  backdrop-filter:blur(22px) saturate(170%) !important;
  -webkit-backdrop-filter:blur(22px) saturate(170%);
  border-bottom:1px solid rgba(255,255,255,.55);
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset, 0 2px 12px -6px rgba(20,30,60,.14);
}
.glass-on .topbar{
  background:rgba(255,255,255,.35);
  backdrop-filter:blur(12px) saturate(150%);
  -webkit-backdrop-filter:blur(12px) saturate(150%);
}

/* ---------- 5. inner chips stay solid so glass-on-glass stays readable ---------- */
.glass-on .verdict,
.glass-on .offer-card .eg,
.glass-on .uc-card .ex:not(.ucdark .ex){
  background:rgba(255,255,255,.55);
  backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px);
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset, var(--line) 0 0 0 1px;
  border-radius:10px;
}

/* ---------- 6. alternate/res section bands become subtle tint ---------- */
.glass-on .res,
.glass-on section.alt{
  background:rgba(255,255,255,.22);
}

/* ---------- reduced-motion / no-backdrop-filter fallback ---------- */
@media (prefers-reduced-motion: reduce){
  .glass-on .offer-card::after,
  .glass-on .num::after,
  .glass-on .uc-card:not(.ucdark)::after,
  .glass-on .res-card::after,
  .glass-on .demo-card::after{ display:none; }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  .glass-on .offer-card, .glass-on .num, .glass-on .uc-card,
  .glass-on .res-card, .glass-on .demo-card, .glass-on nav{
    background:rgba(255,255,255,.92);
  }
}
`;
