-- Two-step sign-in, for Super Admins and practitioners: after the password, a 6-digit code is emailed to the account.
-- `two_factor_enabled_at` is set once the person proves they can receive the codes; NULL means it is off.
ALTER TABLE users ADD COLUMN two_factor_enabled_at TEXT;

-- One short-lived code per user and purpose. Only a hash is stored, salted with the row's own id, and a code dies
-- after a few wrong guesses, after use, or after ten minutes. For a sign-in, `challenge_hash` is the SHA-256 of a
-- random token held in the browser that started it, so a code can only be used by that same browser.
CREATE TABLE login_codes (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose        TEXT NOT NULL CHECK (purpose IN ('login', 'enable', 'disable')),
  code_hash      TEXT NOT NULL,
  challenge_hash TEXT,
  expires_at     TEXT NOT NULL,
  attempts       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX login_codes_user_idx ON login_codes (user_id, purpose);
CREATE INDEX login_codes_challenge_idx ON login_codes (challenge_hash);
