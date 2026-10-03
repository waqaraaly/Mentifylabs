-- Lets a practitioner pause new bookings without unpublishing their profile. 1 = clients can book
-- (the default, so every existing profile behaves as before), 0 = the Book button is hidden and
-- booking requests are refused. Existing appointments are untouched.
ALTER TABLE practitioners ADD COLUMN accepting_bookings INTEGER NOT NULL DEFAULT 1;
