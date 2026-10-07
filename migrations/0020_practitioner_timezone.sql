-- Each practitioner has a time zone: the clock their slots, sessions and dashboard run on. It is a standard zone name
-- such as "Asia/Karachi" or "America/New_York", so daylight saving and new regions need no code. Everyone who exists
-- today is in Pakistan, so they all start there; new practitioners are set from their device when they sign up.
-- Slots and appointments keep storing a plain date and time. They mean that time on this practitioner's clock.
ALTER TABLE practitioners ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Karachi';
