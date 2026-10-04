-- An account is either active or suspended. Approval is not an account state: a practitioner signs up, confirms
-- their email and is in. Whether their credentials have been reviewed is the verification status, and that alone
-- decides whether they can publish.
--
-- Existing rows move across: waiting accounts become active, and accounts that were rejected become suspended,
-- which keeps them signed out and lets Super Admin reactivate any of them later.
UPDATE practitioners SET status = 'suspended', suspended_on = COALESCE(suspended_on, date('now')),
                         profile_status = 'suspended'
 WHERE status = 'rejected';
UPDATE practitioners SET status = 'active' WHERE status = 'pending';

-- The column's old default and CHECK still allow 'pending' and 'rejected', and SQLite can't change those in place
-- without rebuilding the table every other table points at. This keeps 'pending' from ever being stored again.
CREATE TRIGGER practitioners_status_never_pending
AFTER INSERT ON practitioners
WHEN NEW.status = 'pending'
BEGIN
  UPDATE practitioners SET status = 'active' WHERE id = NEW.id;
END;
