-- Which profile template a practitioner has chosen, and the changes they made to it (accent colour, typeface, photo
-- shape, hidden sections) as JSON. Empty means the original design, which keeps using color_theme.
ALTER TABLE practitioners ADD COLUMN profile_template TEXT;
ALTER TABLE practitioners ADD COLUMN profile_style TEXT;
