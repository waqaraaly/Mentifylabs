/** Limits on verification files. Safe to import from the browser, so the form and the server check the same numbers. */

/** The largest single file. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** The most one submission can carry in total, however many options are ticked. */
export const MAX_CREDENTIAL_BATCH_BYTES = 30 * 1024 * 1024;

/** What the file chooser offers. The server checks the real file type again. */
export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
