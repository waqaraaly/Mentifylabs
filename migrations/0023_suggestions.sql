-- Suggestions from practitioners: what to improve and which features they would like. Not a questionnaire: two optional
-- free-text answers, at least one filled in. Super Admin reads them and marks each one reviewed.
CREATE TABLE suggestions (
  id                TEXT PRIMARY KEY DEFAULT ('sug-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  improve           TEXT,
  features          TEXT,
  status            TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX suggestions_status_idx ON suggestions (status, created_at);
CREATE INDEX suggestions_practitioner_idx ON suggestions (practitioner_slug, created_at);
