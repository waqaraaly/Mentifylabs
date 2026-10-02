/** Brand colours from globals.css, inlined because email clients ignore stylesheets and CSS variables. */
const C = {
  page: "#f6f4ea",
  card: "#ffffff",
  text: "#2e3522",
  muted: "#6f7257",
  rule: "#e6e4cf",
  hero: "#3f4e30",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface EmailContent {
  /** Small label above the heading, e.g. "Verification" or "Account". */
  eyebrow: string;
  heading: string;
  /** Body paragraphs, shown after the greeting. */
  body: string[];
  /** A message from the team (e.g. the admin's reason), set apart as a quote. */
  note?: { label: string; text: string };
  button?: { label: string; url: string };
  /** Small print under the button. */
  footnote?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const multiline = (s: string) => escapeHtml(s).replace(/\n/g, "<br>");

/** Branded HTML version of the message; the caller sends a plain-text version alongside it. */
export function renderEmailHtml(content: EmailContent, greeting: string): string {
  const { eyebrow, heading, body, note, button, footnote } = content;

  const noteHtml = note
    ? `<div style="margin:8px 0 28px;padding:18px 20px;background:${C.page};border-radius:10px;">
        <div style="font-size:13px;color:${C.muted};margin-bottom:6px;">${escapeHtml(note.label)}</div>
        <div style="font-size:16px;line-height:1.55;color:${C.text};">${multiline(note.text)}</div>
      </div>`
    : "";

  const buttonHtml = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr>
        <td style="background:${C.hero};border-radius:999px;">
          <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(button.label)}&nbsp;&rarr;</a>
        </td></tr></table>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${C.muted};">${multiline(footnote)}</p>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT};color:${C.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(body[0] ?? heading)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
    <tr><td align="center" style="padding:40px 16px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <tr><td style="padding:0 4px 20px;font-size:18px;font-weight:700;letter-spacing:-.02em;color:${C.hero};">
          Mentify<span style="font-weight:400;">Labs</span>
        </td></tr>
        <tr><td style="background:${C.card};border-radius:16px;padding:40px 40px 32px;">
          <div style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${C.muted};">${escapeHtml(eyebrow)}</div>
          <h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;font-weight:700;letter-spacing:-.02em;color:${C.text};">${escapeHtml(heading)}</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${C.text};">${escapeHtml(greeting)}</p>
          ${body.map((t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${C.text};">${multiline(t)}</p>`).join("")}
          ${noteHtml}
          ${buttonHtml}
          ${footnoteHtml}
        </td></tr>
        <tr><td style="padding:24px 8px 0;font-size:13px;line-height:1.6;color:${C.muted};">
          The MentifyLabs team<br>
          Sent because of activity on your MentifyLabs account.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Plain-text twin of the same content, for clients that don't show HTML. */
export function renderEmailText(content: EmailContent, greeting: string): string {
  const { body, note, button, footnote } = content;
  return [
    greeting,
    ...body,
    note ? `${note.label}:\n${note.text}` : "",
    button ? `${button.label}:\n${button.url}` : "",
    footnote ?? "",
    "The MentifyLabs team",
  ]
    .filter(Boolean)
    .join("\n\n");
}
