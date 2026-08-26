---
name: proofworks-verifier
description: Verify and backfill cited claims in research output.
version: 0.1.0
author: code-agent, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [research, verification, citations, sources, agents]
    related_skills: [grounded-citations]
---

# Proofworks Verifier Skill

A verify-and-backfill loop for research output. When a main agent produces a
cited answer or report, this refines it: extract each claim and its citation,
**fetch** every source, check each claim against its source (literal first, then
judged), and **backfill** an extra source for any claim that ends up unsupported.
Runs 100% client-side — nothing leaves your machine.

It does NOT search the literature for you. Its job is to make the citations you
already have trustworthy, and to find a missing source when one is needed.

Comes with two stdlib Python helpers in `scripts/` that do the parts an LLM
cannot be trusted to do by hand: `fetch_source.py` (download + strip a URL to
text) and `presence_match.py` (decide deterministically whether a quoted
number/phrase literally appears in a source).

## When to Use

- A main agent produced a research draft, report, or answer with citations and
  you want each cited claim checked against its real source before you trust it.
- You need to prove a specific quote, statistic, or number actually appears in
  the page it cites (LLMs fabricate or misattribute these).
- A claim in your output points at a source that does not clearly support it and
  you want a better second source found and pinned.

Don't use for: open-ended literature search, finding papers on a topic
(a research agent like Elicit is for that), or fact-checking a claim with no
citation at all.

## Prerequisites

- Python 3 (stdlib only; no pip installs needed).
- Network access to fetch the sources you cite.
- An agent with an LLM capable of reading stripped source text and judging
  support (any current model).

## Quick Reference

```bash
# Fetch a source to clean text, then check quoted fragments against it.
python3 scripts/fetch_source.py <url> --max-chars 20000
cat source.txt | python3 scripts/presence_match.py --claim "<quote>" --claim "<number>"
```

## Procedure

Run this loop to verify a cited draft. Track every claim through to a final
tag; the draft is not done until each claim is `verified`, `unsupported`, or
`exhausted`.

**1. Compile (main agent).** Extract each factual claim from the draft and the
URL it cites, into the JSON shape in `references/loop.md`. Keep each claim to a
single checkable assertion; split compound sentences. Note the exact quoted
phrase or number the draft asserts the source contains.

**2. Fetch (deterministic).** For each unique source URL, run
`fetch_source.py <url>` and save the stripped text. Never paraphrase or
summarize a source from memory — read what the script prints. If a fetch fails
(exit 1), tag that claim `unsupported` and note the fetch error; do not guess
the content.

**3. Presence pass (deterministic).** For each claim, pipe the fetched source
into `presence_match.py --claim "<the specific quote/number>"`. If `present:
true`, the claim is `verified` on the literal passage — record the matched
fragment. If `absent`, continue.

**4. Semantic pass (agent, LLM).** For `absent` claims, read the actual stripped
source text and judge: does the passage the draft points at support the claim as
written? Judge strictly — a source that merely passes near a topic does not
support a specific assertion. Tag `supported` (you can name the supporting
passage) or `unsupported`.

**5. Backfill (agent + helper).** For each `unsupported` claim, find one extra
credible source that does support it, fetch it with `fetch_source.py`, and
re-run steps 3–4 on it. If it now verifies, tag `verified` and ADD the new
source to the citation. If the second source also fails, tag `exhausted`.

**6. Report.** Emit the annotated draft: every claim tagged `verified`,
`unsupported`, or `exhausted`, each verified claim showing the source passage
(or matched fragment) that backs it. Flag unsupported/exhausted claims in the
draft so a reader knows they are not backed. Add any backfilled source to the
reference list.

## Pitfalls

- **Never trust your memory of a source.** Fetch it with `fetch_source.py` and
  read the printed text. Paraphrasing a source you half-remember is how
  fabricated citations slip in.
- **`absent` is not automatically a lie.** A claim can be true but poorly
  sourced. That's what the semantic pass and backfill are for — a true claim
  deserves a verifiable citation, not a shrug.
- **Probe with a distinctive phrase, not a word.** `presence_match.py` flags an
  `absent` result when a probe is too generic or short to prove anything. Probe
  with a multi-word run or the number itself ("45% of U.S. adults"), not a bare
  noun like "D1" — otherwise the check proves nothing.
- **Numbers and commas:** `presence_match.py` strips thousands separators, so a
  claim "1,248.60" matches "1248.60" in a source. Use the helper rather than
  grepping, or the comma mismatch will look like a failure.
- **Long quotes:** the helper checks distinctive fragments, not the entire
  sentence. A `present` result means a distinctive run of the quote appears —
  still eyeball the surrounding sentence for an opposing rebuttal.
- **`exhausted` is a real outcome.** After two independent sources fail to back
  a claim, report it as unsupported. Do not keep hunting to force a green check,
  and do not soften the wording to make it pass.

## Verification

- Run the three examples in the "Quick Reference" and confirm each exits 0 and
  prints the expected JSON verdicts (see `scripts/README`).
- After a backfill, "verify" that the added source is a real, fetched URL and
  that the claim's matched fragment actually appears in its stripped text.
- A draft is verified only when its final report lists every claim with a tag and
  a backing fragment or source — not when it "feels" supported.