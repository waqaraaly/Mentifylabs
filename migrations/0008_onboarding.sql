-- Set once a practitioner finishes (or skips) the guided first-login setup
-- at /onboarding. NULL gates dashboard access: the layout redirects to
-- /onboarding until this is set, so a new practitioner never sees the
-- portal itself before completing (or explicitly skipping) setup.
ALTER TABLE practitioners ADD COLUMN onboarded_at TEXT;

-- Grandfather every practitioner who already exists — only accounts created
-- from here on (via self-signup or Super Admin) should see the wizard.
UPDATE practitioners SET onboarded_at = created_at WHERE onboarded_at IS NULL;
