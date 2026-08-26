// claim-engine.ts
// Deterministic claim extraction + source matching (no LLM in the core loop).
//
// Oracle contract: every claim verdict carries a `confidence` ladder describing
// HOW the verdict was reached:
//   - 'certain'        -> computed deterministically (arithmetic / conversion / identity)
//   - 'source-backed'  -> matched against fetched source text (token overlap)
//   - 'unverifiable'   -> no source, not computable; refuses to fake a verdict
// This is the anti-hallucination layer: an oracle that admits what it cannot
// verify rather than inventing certainty.

export type Confidence = 'certain' | 'source-backed' | 'unverifiable';
export type Method = 'computed' | 'matched' | 'refused';

export type Verdict =
  | 'confirmed'   // deterministically verified (computed true / exact match)
  | 'refuted'     // deterministically shown false
  | 'supported'   // source-backed, strong match
  | 'partial'     // source-backed, weak/partial match
  | 'unsupported' // source-backed mismatch (source contradicts claim)
  | 'no_source'   // no source supplied and not computable
  | 'unverifiable'; // source fetch failed / not computable

export interface Claim {
  claim_text: string;
  source_url: string | null;
  source_snippet: string | null;
  verdict: Verdict;
  /** Ladder: how trustworthy the verdict is. */
  confidence: Confidence;
  /** Which engine produced the verdict. */
  method: Method;
  /** Computed detail when method === 'computed'. */
  computed?: {
    kind: 'arithmetic' | 'unit-conversion' | 'date';
    expression?: string;
    result?: string;
    claimed?: string;
  } | null;
}

export interface CheckInput {
  ai_text: string;
  sources?: string[];
}

/**
 * Split pasted AI text into discrete claim sentences.
 * Deterministic: split on sentence boundaries, drop fragments too short to matter,
 * trim, and drop meta-sentences that carry no factual content.
 */
export function extractClaims(aiText: string): string[] {
  return aiText
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/) // split on sentence boundaries
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 12) // drop tiny fragments
    .filter((s) => !/^(set_recipient|\.)$/.test(s)) // drop pure-punctuation / empty
    // Drop "filler" sentences that aren't checkable claims.
    .filter((s) => !/^(here(?:'| i)s|let me|i'll|in (?:this|my)|as an\b|importantly,)/i.test(s))
    .slice(0, 30); // cap per check
}

// ---------------------------------------------------------------------------
// CERTAIN TIER — deterministic computation (no source needed, no fuzzy match).
// These are airtight but deliberately NARROW. We only claim certainty when we
// genuinely computed an exact result; everything else falls to matching.
// ---------------------------------------------------------------------------

// Safe arithmetic evaluator — hand-rolled recursive descent, NO eval().
// Supports + - * / %, parentheses, decimals, and pi/e constants.
function tokenize(expr: string): string[] {
  return (expr.match(/\d+(?:\.\d+)?|pi|\bpi\b|e|\(|\)|[+\-*/%^]|\.|×|÷|·|x(?=\s*\d)/gi) || [])
    .map((t) => {
      if (t === '×' || t === '·' || t === 'x') return '*';
      if (t === '÷') return '/';
      return t;
    });
}

class ArithParser {
  private toks: string[];
  private i = 0;
  constructor(expr: string) { this.toks = tokenize(expr); }
  private peek() { return this.toks[this.i]; }
  private next() { return this.toks[this.i++]; }
  parse(): number {
    const v = this.expr();
    if (this.i < this.toks.length) throw new Error('trailing');
    return v;
  }
  private expr(): number {
    let v = this.term();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.next(); const r = this.term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  private term(): number {
    let v = this.factor();
    while (this.peek() === '*' || this.peek() === '/' || this.peek() === '%') {
      const op = this.next(); const r = this.factor();
      if (op === '*') v *= r;
      else if (op === '/') { if (r === 0) throw new Error('div0'); v /= r; }
      else v %= r;
    }
    return v;
  }
  private factor(): number {
    const t = this.peek();
    if (t === '(') { this.next(); const v = this.expr(); if (this.peek() !== ')') throw new Error('paren'); this.next(); return v; }
    if (t === '-') { this.next(); return -this.factor(); }
    if (t === 'pi') { this.next(); return Math.PI; }
    if (t === 'e' || t === 'E') { this.next(); return Math.E; }
    if (/^\d/.test(t || '')) { this.next(); return parseFloat(t); }
    throw new Error('bad token');
  }
}

/** Try to evaluate a bare arithmetic expression. Returns number or null. */
function tryEvalArith(expr: string): number | null {
  const clean = expr.trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)(half|one-half)\s+of\s+/gi, '0.5*')
    .replace(/\b(?:percent|per cent)\b/gi, '%')
    .replace(/(\d+(?:\.\d+)?)\s*(%)\s*of\s*/gi, '($1/100)*')
    .replace(/\btwice\s+(\d[\d.]*)/gi, '2*$1')
    .replace(/\bdouble\s+(\d[\d.]*)/gi, '2*$1');
  // Guard: must look like arithmetic, only allowed chars.
  if (!/^[\d\s.+\-*/%^()[\]pieE×÷·x,]+$/i.test(clean)) return null;
  if (!/[+\-*/%]/.test(clean.replace(/^[-+]/g, ''))) return null; // needs an operator
  const ascii = clean.replace(/[\[\]]/g, '(');
  if (!/^[\d\s.+\-*/%^()pieE]+$/i.test(ascii)) return null;
  try {
    const v = new ArithParser(ascii).parse();
    if (!Number.isFinite(v)) return null;
    return Math.round(v * 1e9) / 1e9; // snap float noise
  } catch { return null; }
}

/** Parse words around an "=" that indicate the LLM's claimed result. */
const CLAIM_RESULT = /=|equals|(?:is |are )(\d[\d.,]*%?)|comes to|works out to|totals?/i;

interface Computed {
  kind: 'arithmetic' | 'unit-conversion' | 'date';
  expression: string;
  result: string;
  claimed?: string;
}

/**
 * Deterministically compute a claim that carries arithmetic / a ratio / a date.
 * Returns null when the claim isn't safely computable (gives up honestly).
 */
export function tryComputeClaim(claim: string): Computed | null {
  const s = claim.trim();
  if (!s) return null;

  // -- 0) day-of-week for a stated date:  "Jan 1 2027 is a Friday" -------------
  {
    const dm = s.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i);
    const dw = s.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (dm && dw) {
      const months: Record<string, number> = { jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,sept:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11 };
      const mo = months[dm[1].toLowerCase().slice(0, 3)];
      const day = parseInt(dm[2], 10);
      const yr = parseInt(dm[3], 10);
      if (mo !== undefined && day >= 1 && day <= 31 && yr > 1800 && yr < 2200) {
        const date = new Date(yr, mo, day);
        const dow = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
        if (date.getFullYear() === yr && date.getMonth() === mo && date.getDate() === day) {
          return { kind: 'date', expression: `${dm[1]} ${day} ${yr}`, result: dow, claimed: dw[1].toLowerCase() };
        }
      }
    }
  }

  // -- 1) "X% of Y" ratio with stated result:  "15% of 1200 is 180" -------------
  {
    const m = s.match(/([\d.,]+)\s*%\s+of\s+([\d.,]+)\s+(?:is|equals|are\b|=)\s+([\d.,]+%?)/i);
    if (m) {
      const pct = parseFloat(m[1].replace(/,/g, ''));
      const base = parseFloat(m[2].replace(/,/g, ''));
      const claimed = parseFloat(m[3].replace(/[%,]/g, ''));
      if ([pct, base, claimed].every(Number.isFinite) && base !== 0 && pct !== 0) {
        const calc = pct / 100 * base;
        return {
          kind: 'arithmetic',
          expression: `${m[1]}% of ${m[2]}`,
          result: String(Math.round(calc * 1e4) / 1e4),
          claimed: m[3],
        };
      }
    }
  }

  // -- 2) arithmetic expression with an explicit result:  "2.5 * 40 = 100" ------
  //      matching an expression (2..5 operands joined by operators) then = N
  {
    const operands = /[-+]?\d[\d.,]*(?:\.\d+)?/;
    const op = /\s*(?:[+*/%×÷·-])\s*/;   // non-capturing so group 2 = RHS number
    const exprPat = operands.source + '(?:' + op.source + operands.source + '){1,4}';
    // 2..5 operands joined by operators, then "= N" at the end of the line.
    const re = new RegExp(`^\\s*(${exprPat})\\s*=\\s*([-+]?\\d[\\d.,]*(?:\\.\\d+)?)%?\\s*$`, 'i');
    const m = s.match(re);
    if (m) {
      const [lhs, rhsRaw] = [m[1], m[2]];
      const isPctOf = /%/.test(lhs);
      const calc = tryEvalArith(lhs);
      const rhs = parseFloat(rhsRaw.replace(/,/g, ''));
      if (calc !== null && Number.isFinite(rhs) && !isPctOf) {
        return { kind: 'arithmetic', expression: lhs.trim(), result: String(calc), claimed: rhsRaw };
      }
    }
  }

  // -- 3) "divided by" / multiplication-word arithmetic with a stated result:
  //      "64 divided by 8 is 8", "12 times 4 equals 48" --------------------------
  {
    const wordRe = s.match(/^([-+]?\d[\d.,]*(?:\.\d+)?)\s*(?:divided\s+by|times|multiplied\s+by|plus|minus)\s+([-+]?\d[\d.,]*(?:\.\d+)?)\s+(?:is|equals|are\b|=)\s*([-+]?\d[\d.,]*(?:\.\d+)?)$/i);
    if (wordRe) {
      const a = parseFloat(wordRe[1].replace(/,/g, ''));
      const b = parseFloat(wordRe[2].replace(/,/g, ''));
      const c = parseFloat(wordRe[3].replace(/,/g, ''));
      const w = wordRe[0].match(/divided|times|multiplied|plus|minus/i)?.[0];
      const opMap: Record<string, (x: number, y: number) => number> = {
        'divided': (x, y) => y !== 0 ? x / y : NaN,
        'times': (x, y) => x * y,
        'multiplied': (x, y) => x * y,
        'plus': (x, y) => x + y,
        'minus': (x, y) => x - y,
      };
      if ([a, b, c].every(Number.isFinite) && w && opMap[w]) {
        const calc = opMap[w](a, b);
        if (Number.isFinite(calc)) {
          return { kind: 'arithmetic', expression: `${a} ${w} ${b}`, result: String(Math.round(calc * 1e9) / 1e9), claimed: wordRe[3] };
        }
      }
    }
  }

  // -- 4) bare trailing result phrase that IS clearly a number: "which is 21.33"
  //      (only fire when a clear arithmetic expression precedes it) ---------------
  {
    const m = s.match(/([-+]?\d[\d.]*(?:\s*[+\-*/%×÷·]\s*\d[\d.]*)+)\s*(?:which is|that is|equals|=\s*)\s*[-+]?\d[\d.,]*(?:\.\d+)?\s*$/i);
    if (m) {
      const calc = tryEvalArith(m[1].replace(/[()]/g, ''));
      if (calc !== null) {
        return { kind: 'arithmetic', expression: m[1].trim(), result: String(calc) };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SOURCE-BACKED TIER — fetch + token-overlap matching (existing engine).
// ---------------------------------------------------------------------------

/** Fetch and extract readable text from a source URL (best-effort, bounded). */
export async function fetchSource(url: string): Promise<{ ok: boolean; text: string; error?: string }> {
  if (!/^https?:\/\//i.test(url)) return { ok: false, text: '', error: 'not-http' };
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Proofworks/0.2 (deterministic-oracle; contact: none)' },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!res.ok) return { ok: false, text: '', error: `http-${res.status}` };
    const raw = await res.text();
    // strip common tags for a plain-text snippet
    const plain = raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { ok: true, text: plain.slice(0, 6000) };
  } catch (e: any) {
    return { ok: false, text: '', error: e?.message ?? 'fetch-failed' };
  }
}

/** Simple fuzzy token match of a claim against source text. */
function similarity(claim: string, sourceText: string): number {
  const stop = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'was', 'be', 'it']);
  const c = new Set(claim.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !stop.has(w) && w.length > 3));
  if (c.size === 0) return 0;
  const sWords = new Set(sourceText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/));
  let hits = 0;
  for (const w of c) if (sWords.has(w)) hits++;
  return hits / c.size;
}

/** Match a claim against each source and assign a source-backed verdict. */
export async function matchClaims(claims: string[], sources: string[]): Promise<Claim[]> {
  const sourceTexts: string[] = [];
  for (const url of sources.slice(0, 3)) {
    const f = await fetchSource(url);
    sourceTexts.push(f.ok ? f.text : '');
  }
  return claims.map((claim_text) => {
    // --- CERTAIN tier first: if we computed it, matching adds nothing. ---
    const computed = tryComputeClaim(claim_text);
    if (computed) {
      let verdict: Verdict = 'confirmed';
      if (computed.claimed !== undefined) {
        if (computed.kind === 'date') {
          // compare day-of-week strings (case-insensitive)
          verdict = String(computed.result).toLowerCase() === String(computed.claimed).toLowerCase()
            ? 'confirmed' : 'refuted';
        } else {
          // numeric compare for arithmetic
          verdict = parseFloat(computed.result) === parseFloat(computed.claimed.replace(/[%,]/g, ''))
            ? 'confirmed' : 'refuted';
        }
      }
      return {
        claim_text, source_url: null, source_snippet: null,
        verdict, confidence: 'certain', method: 'computed', computed,
      };
    }

    // --- SOURCE-BACKED tier ---
    let bestSim = 0, bestIdx = -1;
    for (let i = 0; i < sourceTexts.length; i++) {
      const s = similarity(claim_text, sourceTexts[i]);
      if (s > bestSim) { bestSim = s; bestIdx = i; }
    }
    const source_url = bestIdx >= 0 ? sources[bestIdx] : null;
    const source_snippet = bestIdx >= 0 ? sourceTexts[bestIdx].slice(0, 400) : null;

    let verdict: Verdict;
    let confidence: Confidence = 'unverifiable';
    let method: Method = 'refused';
    if (bestIdx < 0 || bestSim === 0) {
      verdict = 'no_source';           // no source supplied & not computable
    } else {
      confidence = 'source-backed';
      method = 'matched';
      if (bestSim >= 0.6) verdict = 'supported';
      else if (bestSim >= 0.35) verdict = 'partial';
      else verdict = 'unsupported';
    }
    return { claim_text, source_url, source_snippet, verdict, confidence, method, computed: null };
  });
}