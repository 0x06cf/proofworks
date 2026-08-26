# Helper scripts

Two stdlib-only Python scripts that do the deterministic parts of the
verify-and-backfill loop. An LLM should never do these by hand, because it can
hallucinate the result.

## fetch_source.py

Download a URL and strip it to clean readable text on stdout.

```bash
python3 fetch_source.py "https://developers.cloudflare.com/workers/" --max-chars 20000
```

Exit 0 = fetched and printed. Exit 1 = fetch failed (HTTP/network), error on
stderr. Pass `--timeout N` to bound slow sources.

`strip_to_text` **preserves link URLs** — an anchor like
`<a href="https://example.com/commit/abc">label</a>` becomes `label
( https://example.com/commit/abc )` in the output, so author citations (commit
links, footnotes, source URLs) survive into the text that the presence pass and
the backfill-mine step search. Fragment-only (`#x`) and `mailto:`/`js:` links
are dropped to avoid noise.

Note on gitiles/googlesource: `?format=TEXT` returns **base64** (the diff text is
encoded). If a fetch returns a base64 blob rather than readable text, decode it
before judging — or prefer the rendered `+/ref/file` HTML view / JSON API.

## presence_match.py

Read a source (stdin), check quoted probes against it literally, emit JSON.

```bash
cat source.txt | python3 presence_match.py --claim "45% of U.S. adults" --claim "1,248.60"
```

Output: one object per `--claim`, each with `{present, matched_fragment, method:
"literal", claim}`.

- `present: true` — a distinctive normalized fragment of the probe appears in
  the source. The agent should still view the surrounding passage to confirm
  context (a number can appear in a correction or a negated sentence).
- `present: false` — no distinctive fragment found. Move to the semantic pass.

Normalization lowercases, strips commas (so `1,248.60` matches `1248.60`), and
collapses whitespace/dashes so near-verbatim quotes still land.

## Self-test (sanity check the helpers)

```bash
printf 'The total is 1,248.60 and Workers handles HTTP requests.' \
  | python3 presence_match.py --claim "the total is 1,248.60" --claim "There are 3 planets in the solar system"
# expect: first claim present, second absent
```