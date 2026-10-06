-- A practitioner's profile link is now something they choose, not something made from their name.
-- `slug_chosen_at` records when it was chosen. A practitioner with no choice yet carries a hidden placeholder slug
-- (p-xxxxxxxx), which the rest of the data still needs as the key other tables point at.
-- Everyone who exists today already has a working link, so they all count as chosen.
ALTER TABLE practitioners ADD COLUMN slug_chosen_at TEXT;
UPDATE practitioners SET slug_chosen_at = COALESCE(created_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
