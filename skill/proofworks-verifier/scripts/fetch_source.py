#!/usr/bin/env python3
"""fetch_source.py — deterministic fetch + strip a URL to clean text.

Part of the Proofworks verify-and-backfill loop. The MAIN AGENT must not fake
what a source says; this script is the ground-truth fetcher. It downloads a URL,
strips markup, and returns plain text that the agent then reads and judges.

Stdlib-only, no auth, bounded. Cross-platform (Linux/macOS/Windows).

Usage:
    python3 fetch_source.py <url> [--max-chars 20000] [--timeout 15]

Exits:
    0  text fetched and written to stdout
    1  fetch failed (HTTP/network error printed to stderr)
"""

import argparse
import html
import re
import sys
import urllib.error
import urllib.request

# Common noise inside <script>/<style>. Handle either <script> or <script ...>.
STRIP_BLOCKS = re.compile(
    r"<(script|style|noscript)[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL
)
TAGS = re.compile(r"<[^>]+>")
WHITESPACE = re.compile(r"[ \t\r\f\v]+")
BLANKS = re.compile(r"(\s*\n){2,}")

USER_AGENT = "proofworks-verifier/0.1 (research source fetcher)"


def fetch(url: str, timeout: float = 15.0) -> str:
    """Return the raw HTTP body for a URL, raising on failure."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        # bytes -> decode. Detect charset from headers, else UTF-8 with fallback.
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
        try:
            return raw.decode(charset, errors="replace")
        except LookupError:
            return raw.decode("utf-8", errors="replace")


def strip_to_text(html_src: str) -> str:
    """Turn an HTML document into readable plain text."""
    text = STRIP_BLOCKS.sub(" ", html_src)  # drop script/style/noscript blocks
    text = TAGS.sub(" ", text)              # drop remaining tags
    text = html.unescape(text)              # &amp; -> &, &nbsp; -> \xa0, etc.
    text = WHITESPACE.sub(" ", text)        # collapse horizontal whitespace
    text = text.replace("\xa0", " ")        # nbsp -> space
    return BLANKS.sub("\n\n", text).strip()


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch a URL and print clean text.")
    ap.add_argument("url", help="http(s) URL to fetch")
    ap.add_argument("--max-chars", type=int, default=20000, help="truncate output")
    ap.add_argument("--timeout", type=float, default=15.0, help="HTTP timeout (s)")
    args = ap.parse_args()

    if not re.match(r"^https?://", args.url, re.IGNORECASE):
        print("fetch_source: url must start with http(s)://", file=sys.stderr)
        return 1

    try:
        html = fetch(args.url, args.timeout)
    except urllib.error.HTTPError as e:
        print(f"fetch_source: http {e.code} {e.reason}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"fetch_source: {e.reason}", file=sys.stderr)
        return 1
    except Exception as e:  # network / timeout races
        print(f"fetch_source: {e}", file=sys.stderr)
        return 1

    text = strip_to_text(html)
    if args.max_chars > 0:
        text = text[: args.max_chars]
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())