-- Confirms a sign-in account's email actually belongs to whoever signed up.
-- Doesn't gate anything by itself (Super Admin approval remains the real
-- gate before a profile is published) — it's a signal admins can see, and
-- protects against someone signing up with an email they don't own.
ALTER TABLE users ADD COLUMN email_verified_at TEXT;

-- One-time verification links, same shape as password_resets: the id is the
-- SHA-256 of the emailed token, so the table alone can't verify anything.
CREATE TABLE email_verifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX email_verifications_user_idx ON email_verifications (user_id);
