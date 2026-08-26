#!/usr/bin/env python3
"""Tests for the proofworks-verifier helper scripts. No live network.

Run from the skill directory:
    python3 tests/test_helpers.py

Exit 0 = all pass. Uses only stdlib.
"""

import contextlib
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.join(HERE, "..", "scripts")


def run_presence(source: str, claims: list) -> list:
    cmd = [sys.executable, os.path.join(SCRIPTS, "presence_match.py")]
    for c in claims:
        cmd += ["--claim", c]
    proc = subprocess.run(
        cmd, input=source, capture_output=True, text=True, cwd=SCRIPTS
    )
    assert proc.returncode == 0, proc.stderr
    return json.loads(proc.stdout)


def test_present_number_with_commas():
    out = run_presence("The total is 1,248.60 and it is final.", ["1,248.60"])
    assert out[0]["present"] is True, out
    assert out[0]["matched_fragment"] == "1248.60", out  # commas stripped


def test_absent_fabricated_claim():
    out = run_presence("Nothing about Mars here.", ["Mars tourism packages"])
    assert out[0]["present"] is False, out
    # absent still reports what was looked for (auditable)
    assert out[0]["matched_fragment"], out


def test_near_verbatim_quote_survives_punctuation():
    out = run_presence(
        "The Workers platform handles HTTP requests from edge nodes.",
        ["It handles HTTP requests reliably."],
    )
    assert out[0]["present"] is True, out
    assert "handles http requests" in out[0]["matched_fragment"], out


def test_ambiguous_absent_when_multiple_claims():
    out = run_presence(
        "The matched value 42 is correct. Nothing else here.",
        ["matched value 42", "completely missing phrase 99"],
    )
    by_claim = {o["claim"]: o["present"] for o in out}
    assert by_claim["matched value 42"] is True, out
    assert by_claim["completely missing phrase 99"] is False, out


def test_short_generic_probe_reports_absent_with_fragment():
    # A single short token ("D1") is not distinctive; should be absent but still
    # report a fragment for audit.
    out = run_presence("Workers handles HTTP requests.", ["D1"])
    assert out[0]["present"] is False, out
    assert out[0]["matched_fragment"] == "d1", out


def test_stopword_only_fragment_is_not_evidence():
    # "at the" / "of a" appear in nearly any page. A claim whose only present
    # fragment is a stopword run must NOT be treated as verified (false positive).
    out = run_presence(
        "Pricing starts at the free tier. Commands run at the edge.",
        ["execute queries at the edge"],
    )
    assert out[0]["present"] is False, (
        "must not match on a bare stopword run (e.g. 'at the')"
    )


def test_content_fragment_matches_despite_stopwords():
    # A claim that shares a real content phrase with the source DOES verify,
    # even when wrapped in stopwords.
    out = run_presence(
        "Students of a quiet school attend daily.",
        ["students of the school"],
    )
    assert out[0]["present"] is True, out
    assert "students" in out[0]["matched_fragment"], out


def test_fetch_source_rejects_non_http():
    cmd = [
        sys.executable,
        os.path.join(SCRIPTS, "fetch_source.py"),
        "not-a-url",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=SCRIPTS)
    assert proc.returncode == 1, "non-http url must exit 1"


def test_strip_to_text_preserves_anchor_urls():
    # Author citations (commit links, footnotes, source URLs) must survive into
    # the stripped text so the backfill-mine step can find them. Regression for
    # the real miss where a quoted commit URL was deleted by tag-stripping.
    from importlib import util
    spec = util.spec_from_file_location("fs", os.path.join(SCRIPTS, "fetch_source.py"))
    fs = util.module_from_spec(spec)
    spec.loader.exec_module(fs)

    html = (
        '<p>OlyB found this commit '
        '<a href="https://chromium.googlesource.com/chromiumos/platform/ec/+/abc123">'
        "cr50: add fwmp wp policy</a>"
        " in the codebase. It is important.</p>"
    )
    text = fs.strip_to_text(html)
    assert "https://chromium.googlesource.com/chromiumos/platform/ec/+/abc123" in text, (
        "anchor href must survive strip_to_text"
    )
    assert "fwmp wp policy" in text, "anchor label must survive"


def test_strip_to_text_drops_bare_url_as_plain_tag():
    # A bare <a> with no http(s) href should not leak into the text as noise.
    from importlib import util
    spec = util.spec_from_file_location("fs", os.path.join(SCRIPTS, "fetch_source.py"))
    fs = util.module_from_spec(spec)
    spec.loader.exec_module(fs)

    text = fs.strip_to_text('<p>See <a href="#local-anchor">the section</a>.</p>')
    assert "#local-anchor" not in text, "fragment hrefs should not be kept as URLs"
    assert "the section" in text, "anchor label text persists"


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failures = 0
    for t in tests:
        try:
            t()
            print(f"PASS {t.__name__}")
        except AssertionError as e:
            failures += 1
            print(f"FAIL {t.__name__}: {e}")
    print(f"\n{len(tests) - failures}/{len(tests)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())