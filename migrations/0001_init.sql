-- Migration 0001: initial schema
-- Proofworks: human-verified AI claim checker

-- A "context"/account for grouping a user's checks. Kept anonymous by default.
CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'default',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A submitted "check": one paste of AI text + its sources by a human.
CREATE TABLE IF NOT EXISTS checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER REFERENCES workspaces(id),
  ai_text TEXT NOT NULL,             -- the pasted AI answer
  status TEXT NOT NULL DEFAULT 'pending', -- pending | reviewed | confirmed | rejected
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The individual claim rows extracted from ai_text, each tied to one source.
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_id INTEGER REFERENCES checks(id),
  claim_text TEXT NOT NULL,          -- one extracted claim/sentence
  claim_index INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,                   -- optionally the matched source
  source_snippet TEXT,                -- the source passage used
  verdict TEXT NOT NULL DEFAULT 'unverified', -- unverified | supported | partial | unsupported | no_source
  human_verdict TEXT,                 -- confirmed | rejected | flagged  (what the human tapped)
  verified_by TEXT,                   -- optional id
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fast corpus queries (what the MCP/API layer reads)
CREATE INDEX IF NOT EXISTS idx_claims_verdict ON claims(verdict);
CREATE INDEX IF NOT EXISTS idx_claims_human ON claims(human_verdict);
CREATE INDEX IF NOT EXISTS idx_claims_check ON claims(check_id);