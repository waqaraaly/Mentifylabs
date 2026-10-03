-- Email confirmation now gates sign-in: nobody gets into the portal until they have confirmed their address.
--
-- 1. Everyone who already has an account is treated as confirmed, so turning this on never locks an existing
--    practitioner or admin out. Only accounts created after this migration go through confirmation.
UPDATE users
   SET email_verified_at = COALESCE(created_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
 WHERE email_verified_at IS NULL;

-- 2. Changing an email no longer switches the sign-in address straight away. The new one waits here, and each
--    confirmation link records which address it is confirming, until its owner clicks the link.
ALTER TABLE users ADD COLUMN pending_email TEXT;
ALTER TABLE email_verifications ADD COLUMN new_email TEXT;
