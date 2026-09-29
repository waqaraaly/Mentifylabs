-- Sign-in accounts. A practitioner account is linked to its practitioner row;
-- an admin account has none. Passwords are PBKDF2 hashes, never plain text.
CREATE TABLE users (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name            TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('practitioner', 'admin')),
  practitioner_id TEXT UNIQUE REFERENCES practitioners (id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((role = 'practitioner') = (practitioner_id IS NOT NULL))
);

-- The id is the SHA-256 of the cookie token, so a leaked table can't be used to sign in.
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- Failed sign-ins, used to slow down password guessing.
CREATE TABLE login_attempts (
  email TEXT NOT NULL COLLATE NOCASE,
  at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX login_attempts_email_idx ON login_attempts (email, at);
