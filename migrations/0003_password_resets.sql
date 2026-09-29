-- One-time password reset / account invite links. The id is the SHA-256 of the
-- token in the emailed link, so the table alone can't be used to reset anything.
CREATE TABLE password_resets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX password_resets_user_idx ON password_resets (user_id);
