/** The name clients see on a public profile is no longer than the profile editor allows. */
export const PUBLIC_NAME_MAX = 120;

/** A name from a form, tidied: extra spaces and line breaks collapsed, trimmed and clipped to the limit. */
export const tidyPublicName = (value: FormDataEntryValue | string | null | undefined): string =>
  (value?.toString() ?? "").replace(/\s+/g, " ").trim().slice(0, PUBLIC_NAME_MAX);
