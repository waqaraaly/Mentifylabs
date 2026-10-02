-- Privacy-friendly profile analytics. One row per visit to a public profile.
-- No IP address or user agent is stored: `visitor` is a hash made with a random salt that
-- changes every day (see analytics_salts), so it can count distinct people within a day but
-- can't follow anyone across days or be reversed.
CREATE TABLE profile_views (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  day               TEXT NOT NULL,
  visitor           TEXT NOT NULL,
  source            TEXT NOT NULL,
  country           TEXT,
  device            TEXT NOT NULL
);
CREATE INDEX profile_views_practitioner_day_idx ON profile_views (practitioner_slug, day);
CREATE INDEX profile_views_visitor_idx ON profile_views (practitioner_slug, visitor, at);

-- One random salt per day; older days are deleted, which makes old visitor hashes unlinkable.
CREATE TABLE analytics_salts (
  day  TEXT PRIMARY KEY,
  salt TEXT NOT NULL
);
