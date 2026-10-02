-- Lets Super Admin temporarily block a sign-in account (any role) without
-- deleting it. NULL = active. Permanent removal is a real DELETE, not this.
ALTER TABLE users ADD COLUMN disabled_at TEXT;
