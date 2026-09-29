-- Credential verification, independent from account/profile status: a
-- practitioner can be active and published while still unverified. The
-- "verified" checkmark on the public profile reflects this, not publish status.
ALTER TABLE practitioners ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified'));
-- When they submitted documents for review (drives the 60-day deadline banner).
ALTER TABLE practitioners ADD COLUMN verification_submitted_at TEXT;
ALTER TABLE practitioners ADD COLUMN verified_on TEXT;
-- Feedback shown to the practitioner if Super Admin sends a submission back.
ALTER TABLE practitioners ADD COLUMN verification_note TEXT;
-- Set once they dismiss the first-login setup popup, so it only shows once.
ALTER TABLE practitioners ADD COLUMN verification_prompt_seen_at TEXT;
