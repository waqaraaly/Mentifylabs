-- Details of the uploaded file behind a verification document (stored in R2 under storage_key).
ALTER TABLE practitioner_documents ADD COLUMN content_type TEXT;
ALTER TABLE practitioner_documents ADD COLUMN size_bytes INTEGER;
