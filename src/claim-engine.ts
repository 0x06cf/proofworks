// claim-engine.ts
// Deterministic claim extraction + source matching (no LLM in the core loop).

export type Verdict = 'supported' | 'partial' | 'unsupported' | 'no_source' | 'unverified';

export interface Claim {
  claim_text: string;
  source_url: string | null;
  source_snippet: string | null;
  verdict: Verdict;
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

/** Fetch and extract readable text from a source URL (best-effort, bounded). */
async function fetchSource(url: string): Promise<{ ok: boolean; text: string; error?: string }> {
  if (!/^https?:\/\//i.test(url)) return { ok: false, text: '', error: 'not-http' };
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Proofworks/0.1 (claim-verifier; contact: none)' },
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

/** Match a claim against each source and assign a verdict. */
export async function matchClaims(
  claims: string[],
  sources: string[]
): Promise<Claim[]> {
  const sourceTexts: string[] = [];
  for (const url of sources.slice(0, 3)) {
    const f = await fetchSource(url);
    sourceTexts.push(f.ok ? f.text : '');
  }
  return claims.map((claim_text) => {
    let bestSim = 0;
    let bestIdx = -1;
    for (let i = 0; i < sourceTexts.length; i++) {
      const s = similarity(claim_text, sourceTexts[i]);
      if (s > bestSim) {
        bestSim = s;
        bestIdx = i;
      }
    }
    const source_url = bestIdx >= 0 ? sources[bestIdx] : null;
    const source_snippet = bestIdx >= 0 ? sourceTexts[bestIdx].slice(0, 400) : null;
    let verdict: Claim['verdict'];
    if (bestIdx < 0) verdict = 'no_source';
    else if (bestSim >= 0.6) verdict = 'supported';
    else if (bestSim >= 0.35) verdict = 'partial';
    else verdict = 'unsupported';
    return { claim_text, source_url, source_snippet, verdict };
  });
}