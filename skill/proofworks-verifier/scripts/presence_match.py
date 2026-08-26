#!/usr/bin/env python3
"""presence_match.py — deterministic literalism check for the loop's first pass.

Given a source text (stdin) and one or more probe strings claimed by the model,
decide for each whether a distinctive fragment LITERALLY appears in the source.
This is the trustworthy ground-truth pass: an LLM is unreliable at "did the
source actually say X", so this script does it by string comparison.

A probe is `literal` if a normalized version of a distinctive substring of it
appears verbatim (or near-verbatim) in the source. It is `absent` otherwise.

Stdlib-only. Cross-platform.

Usage:
    cat source.txt | python3 presence_match.py --claim "Workers handles HTTP requests" --claim "1,248.60"

Exit 0 always (the verdicts are data, not errors). Writes JSON to stdout.
"""

import argparse
import json
import re
import sys

# A probe must contain a distinctive fragment at least this long to count as
# evidence. Shorter fragments (common words) match everything and prove nothing.
MIN_FRAGMENT = 4
# How many characters of the probe to treat as "the distinctive quote" window.
PROBE_WINDOW = min(180, 80)


def normalize(s: str) -> str:
    """Lowercase, collapse whitespace/punct so near-verbatim matches still land."""
    s = s.lower()
    s = re.sub(r"[\u00a0\u2013\u2014]", "-", s)  # nbsp, en/em dash -> hyphen
    s = re.sub(r"[^\w\s.-]", "", s)             # drop punctuation except . and -
    s = re.sub(r"[-\s]+", " ", s)               # collapse all dashes/spaces
    return s.strip()


def distinctive_substrings(claim: str, window: int = PROBE_WINDOW):
    """Yield candidate strings from the claim to look for, longest first.

    We prefer the longest runs of 2+ words as the strongest evidence, but fall
    back progressively so a long quoted sentence still anchors on a fragment.
    Numbers are kept (they're the highest-value checks — '1,248.60').
    """
    # Force commas into a checkable form (strip thousands separators) so both
    # "1,248.60" and "1248.60" in the claim match "1248.60" in the source.
    variants = [claim, claim.replace(",", "")]
    seen = set()
    for v in variants:
        words = v.split()
        for n in (min(6, len(words)), 4, 3, 2):
            if n == 0:
                break
            for i in range(len(words) - n + 1):
                frag = " ".join(words[i : i + n])
                norm = normalize(frag)
                if len(norm) >= MIN_FRAGMENT and norm not in seen:
                    seen.add(norm)
                    yield norm


def presence_matches(source_norm: str, claim: str) -> dict:
    """Return {present, matched_fragment, method} for one claim against source."""
    present_frag = None
    for frag in distinctive_substrings(claim):
        if frag in source_norm:
            present_frag = frag
            break
    if present_frag is not None:
        return {"present": True, "matched_fragment": present_frag, "method": "literal"}
    # Absent: report the most distinctive fragment we looked for so the agent
    # can audit the check. Prefer the longest normalized form (all words+number).
    best = normalize(claim[: PROBE_WINDOW])
    if not best:
        best = normalize(claim)
    return {"present": False, "matched_fragment": best, "method": "literal"}


def main() -> int:
    ap = argparse.ArgumentParser(description="Deterministic presence check.")
    ap.add_argument("--claim", action="append", required=True,
                    help="a claim/number the model said the source contains (repeatable)")
    args = ap.parse_args()

    source = sys.stdin.read()
    source_norm = normalize(source)

    results = []
    for c in args.claim:
        r = presence_matches(source_norm, c)
        r["claim"] = c
        results.append(r)

    json.dump(results, sys.stdout, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())