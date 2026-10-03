-- A profile can only be public once the practitioner's credentials are verified, and the practitioner is the one
-- who publishes it. Profiles that were published before that rule (admin-approved without verification) go back
-- to draft: they stay editable and previewable, and the practitioner publishes again once verified.
UPDATE practitioners
   SET profile_status = 'draft'
 WHERE profile_status = 'published'
   AND verification_status <> 'verified';
