-- MentifyLabs: initial schema (Cloudflare D1 / SQLite).
-- Dates are 'YYYY-MM-DD', times 'HH:MM', timestamps ISO-8601 text, lists and
-- objects JSON text. D1 enforces foreign keys, so renaming a practitioner's
-- slug cascades to every table that references it.

CREATE TABLE practitioners (
  id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug               TEXT NOT NULL UNIQUE CHECK (slug <> '' AND slug NOT GLOB '*[^a-z0-9-]*'),
  full_name          TEXT NOT NULL,
  professional_title TEXT NOT NULL DEFAULT 'Practitioner',
  email              TEXT NOT NULL,
  phone              TEXT,
  photo_url          TEXT,
  short_bio          TEXT,
  bio                TEXT NOT NULL DEFAULT '',
  specializations    TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(specializations)),
  services           TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(services)),
  experience_years   INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  education          TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(education)),
  work_experience    TEXT CHECK (work_experience IS NULL OR json_valid(work_experience)),
  certifications     TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(certifications)),
  languages          TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(languages)),
  session_type       TEXT NOT NULL DEFAULT 'both' CHECK (session_type IN ('online', 'offline', 'both')),
  fee_currency       TEXT NOT NULL DEFAULT 'PKR',
  fee_min            INTEGER NOT NULL DEFAULT 0 CHECK (fee_min >= 0),
  fee_max            INTEGER NOT NULL DEFAULT 0 CHECK (fee_max >= 0),
  location           TEXT,
  social_links       TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(social_links)),
  website_url        TEXT,
  contact_methods    TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(contact_methods)),
  color_theme        TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  profile_status     TEXT NOT NULL DEFAULT 'draft'
                       CHECK (profile_status IN ('draft', 'in_review', 'published', 'hidden', 'incomplete', 'suspended')),
  creation_method    TEXT NOT NULL DEFAULT 'self' CHECK (creation_method IN ('self', 'super_admin')),
  date_joined        TEXT NOT NULL DEFAULT (date('now')),
  last_sign_in       TEXT,
  approved_on        TEXT,
  suspended_on       TEXT,
  rejection_note     TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE slots (
  id                TEXT PRIMARY KEY DEFAULT ('slot-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  date              TEXT NOT NULL,
  start_time        TEXT NOT NULL,
  end_time          TEXT NOT NULL,
  session_type      TEXT NOT NULL CHECK (session_type IN ('online', 'offline', 'both')),
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked', 'unavailable'))
);
CREATE INDEX slots_practitioner_date_idx ON slots (practitioner_slug, date, start_time);

CREATE TABLE weekly_rules (
  id                TEXT PRIMARY KEY DEFAULT ('rule-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  weekday           INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time        TEXT NOT NULL,
  end_time          TEXT NOT NULL,
  session_type      TEXT NOT NULL CHECK (session_type IN ('online', 'offline', 'both'))
);
CREATE INDEX weekly_rules_practitioner_idx ON weekly_rules (practitioner_slug, weekday);

CREATE TABLE time_off (
  id                TEXT PRIMARY KEY DEFAULT ('off-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  start_date        TEXT NOT NULL,
  end_date          TEXT NOT NULL,
  label             TEXT NOT NULL DEFAULT '',
  CHECK (end_date >= start_date)
);
CREATE INDEX time_off_practitioner_idx ON time_off (practitioner_slug, start_date);

CREATE TABLE day_overrides (
  id                TEXT PRIMARY KEY DEFAULT ('override-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  date              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('custom', 'unavailable')),
  UNIQUE (practitioner_slug, date)
);

CREATE TABLE appointments (
  id                TEXT PRIMARY KEY DEFAULT ('appt-' || lower(hex(randomblob(8)))),
  client_id         TEXT NOT NULL,
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  slot_id           TEXT REFERENCES slots (id) ON DELETE SET NULL,
  client_name       TEXT NOT NULL,
  client_contact    TEXT NOT NULL,
  concern           TEXT,
  date              TEXT NOT NULL,
  start_time        TEXT NOT NULL,
  end_time          TEXT NOT NULL,
  session_type      TEXT NOT NULL CHECK (session_type IN ('online', 'offline')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX appointments_practitioner_idx ON appointments (practitioner_slug, created_at);
-- A slot can be held by at most one live appointment; cancelling frees it.
CREATE UNIQUE INDEX appointments_one_live_per_slot
  ON appointments (slot_id)
  WHERE slot_id IS NOT NULL AND status <> 'cancelled';

CREATE TABLE practitioner_documents (
  id                TEXT PRIMARY KEY DEFAULT ('doc-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('License', 'Certification', 'Identity Verification', 'Other')),
  storage_key       TEXT,
  uploaded_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE features (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  icon              TEXT NOT NULL,
  category          TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('live', 'beta', 'disabled')),
  shared_by_default INTEGER NOT NULL DEFAULT 0 CHECK (shared_by_default IN (0, 1)),
  quantity          INTEGER,
  unit              TEXT,
  plan              TEXT NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE feature_access (
  feature_id        TEXT NOT NULL REFERENCES features (id) ON DELETE CASCADE,
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (feature_id, practitioner_slug)
);

CREATE TABLE feature_access_logs (
  id                TEXT PRIMARY KEY DEFAULT ('fl_' || lower(hex(randomblob(8)))),
  feature_id        TEXT NOT NULL REFERENCES features (id) ON DELETE CASCADE,
  practitioner_slug TEXT REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE SET NULL,
  action            TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'enabled_all', 'disabled_all')),
  by                TEXT NOT NULL DEFAULT 'Super Admin',
  at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  note              TEXT
);
CREATE INDEX feature_access_logs_feature_idx ON feature_access_logs (feature_id, at);

CREATE TABLE admin_settings (
  id                           INTEGER PRIMARY KEY CHECK (id = 1),
  name                         TEXT NOT NULL DEFAULT 'Super Admin',
  email                        TEXT NOT NULL,
  skip_verification_by_default INTEGER NOT NULL DEFAULT 1,
  notify_new_signup            INTEGER NOT NULL DEFAULT 1,
  notify_profile_submitted     INTEGER NOT NULL DEFAULT 1,
  notify_daily_digest          INTEGER NOT NULL DEFAULT 0
);
