# Verify-and-Backfill Loop — protocol detail

The loop turns a cited draft into an annotated, verified draft. Every claim must
end tagged `verified`, `unsupported`, or `exhausted`. Nothing is left in a
"probably fine" state.

## Claim / source JSON shape

Build a list of claims from the draft. One file per job:

```json
{
  "claims": [
    {
      "id": 1,
      "text": "45% of U.S. adults get some news on social media",
      "cited_url": "https://example.com/report",
      "quote": "45% of U.S. adults get some news on social media"
    }
  ]
}
```

- `text` is the claim the draft makes.
- `cited_url` is the source the draft points to.
- `quote` is the most specific string or number the draft asserts the source
  contains. Prefer a number or a repeated distinctive phrase, not the whole
  sentence (short common phrases match everything).
- Keep `text` to one checkable assertion. Split compound sentences into separate
  claims.

## Per-claim lifecycle

```
             ┌───────────────┐
             │ claim + source│
             └───────┬───────┘
                     │ 1. fetch (deterministic)
                     v
             ┌───────────────┐   fetch fail ───────────────► unsupported (note error)
             │ source text   │
             └───────┬───────┘
                     │ 2. presence pass (deterministic)
                     v
              present? ────yes──► verified  (record matched fragment)
                     │no
                     v
             3. semantic pass (LLM judgment)
                     │
          supported?─yes─► verified  (name supporting passage)
                     │no
                     v
             4. backfill: find 1 extra source
                     │
          fetch + re-run 2–3 ──pass──► verified  (ADD new source to citation)
                     │
                    fail
                     v
                  exhausted
```

## Output shape

```json
{
  "claim_id": 1,
  "text": "45% of U.S. adults get some news on social media",
  "tag": "verified",
  "matched_fragment": "45% of U.S. adults",
  "source_url": "https://example.com/report",
  "source_passage": "45% of U.S. adults get some news on social media...",
  "backfilled": false
}
```

- `tag`: `verified` | `unsupported` | `exhausted`
- `matched_fragment`/`source_passage`: present only when `verified`, showing WHY
  it is verified — so the check is auditable, not just asserted.
- `backfilled`: true when an extra source was found and added.

When writing the final annotated draft, mark every non-`verified` claim inline so
a reader does not mistake it for backed. Add any backfilled source to the
reference list.