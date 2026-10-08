-- When the practitioner first saved their public profile. Empty until then; the dashboard uses it to ask them to
-- complete the profile only until they have saved it once.
ALTER TABLE practitioners ADD COLUMN profile_saved_at TEXT;
