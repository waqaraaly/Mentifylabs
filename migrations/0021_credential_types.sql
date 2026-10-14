-- Verification documents now come in more kinds than the four this table was built with (License, Degree, Certification,
-- Professional membership, Identity document, Experience letter, Other), and the list will keep changing. SQLite can't
-- loosen a CHECK in place, so the table is rebuilt without it: the app checks the kind instead.
-- The old "Identity Verification" kind is renamed "Identity document" on the way across.
CREATE TABLE practitioner_documents_new (
  id                TEXT PRIMARY KEY DEFAULT ('doc-' || lower(hex(randomblob(8)))),
  practitioner_slug TEXT NOT NULL REFERENCES practitioners (slug) ON UPDATE CASCADE ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,
  storage_key       TEXT,
  uploaded_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  content_type      TEXT,
  size_bytes        INTEGER
);

INSERT INTO practitioner_documents_new (id, practitioner_slug, name, category, storage_key, uploaded_at, content_type, size_bytes)
SELECT id, practitioner_slug, name,
       CASE category WHEN 'Identity Verification' THEN 'Identity document' ELSE category END,
       storage_key, uploaded_at, content_type, size_bytes
  FROM practitioner_documents;

DROP TABLE practitioner_documents;
ALTER TABLE practitioner_documents_new RENAME TO practitioner_documents;

CREATE INDEX practitioner_documents_practitioner_idx ON practitioner_documents (practitioner_slug);
