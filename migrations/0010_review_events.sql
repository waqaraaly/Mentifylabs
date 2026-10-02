-- Audit trail of Super Admin decisions on a practitioner (account and credential
-- verification), so earlier feedback isn't lost when a newer decision overwrites it.
-- actor_name is a snapshot, so history still reads correctly if the admin is renamed or removed.
CREATE TABLE review_events (
  id                TEXT PRIMARY KEY DEFAULT ('rev-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  kind              TEXT NOT NULL CHECK (kind IN (
                      'account_approved', 'account_rejected', 'account_suspended', 'account_reactivated',
                      'verification_submitted', 'verification_approved', 'verification_rejected')),
  note              TEXT,
  actor_name        TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX review_events_practitioner_idx ON review_events (practitioner_slug, created_at);
