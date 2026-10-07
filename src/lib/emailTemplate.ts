/** Brand colours from globals.css, inlined because email clients ignore stylesheets and CSS variables. */
const C = {
  page: "#f6f4ea", // --background, the oat page
  card: "#ffffff",
  text: "#2e3522", // --foreground, deep moss ink
  muted: "#6f7257", // --muted
  rule: "#e6e4cf", // --border
  moss: "#3f4e30", // --hero, the deepest moss: the header band and the button
  leaf: "#6e8356", // --primary, the brand green
  honey: "#f6e8c8", // --accent
};
// Georgia for the heading echoes the serif the public profile uses; the body stays in the system sans so it renders everywhere.
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export interface EmailContent {
  /** Small label in the header band, e.g. "Verification" or "Account". */
  eyebrow: string;
  heading: string;
  /** Body paragraphs, shown after the greeting. */
  body: string[];
  /** A message from the team (e.g. the admin's reason), set apart as a quote. A short numeric one is shown as a code. */
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

  // A one-time code reads better set large on its own than as a quoted sentence.
  const isCode = !!note && /^\d{4,8}$/.test(note.text.trim());
  const noteHtml = note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr>
        <td style="background:${C.page};border-left:3px solid ${C.leaf};border-radius:0 8px 8px 0;padding:16px 20px;">
          <div style="font-size:13px;color:${C.muted};margin-bottom:${isCode ? 8 : 6}px;">${escapeHtml(note.label)}</div>
          ${
            isCode
              ? `<div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:30px;line-height:1.1;font-weight:700;letter-spacing:.18em;color:${C.text};">${escapeHtml(note.text.trim())}</div>`
              : `<div style="font-size:16px;line-height:1.55;color:${C.text};">${multiline(note.text)}</div>`
          }
        </td></tr></table>`
    : "";

  const buttonHtml = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr>
        <td style="background:${C.moss};border-radius:8px;">
          <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(button.label)}</a>
        </td></tr></table>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:0;font-size:14px;line-height:1.6;color:${C.muted};">${multiline(footnote)}</p>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${SANS};color:${C.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(body[0] ?? heading)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
    <tr><td align="center" style="padding:32px 12px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border-radius:14px;">
        <tr><td style="background:${C.moss};border-radius:14px 14px 0 0;padding:20px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:20px;font-weight:700;letter-spacing:-.01em;color:#ffffff;">Mentify<span style="font-weight:400;color:${C.honey};">Labs</span></td>
            <td align="right" style="font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.honey};">${escapeHtml(eyebrow)}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:36px 36px 8px;">
          <h1 style="margin:0 0 22px;font-family:${SERIF};font-size:27px;line-height:1.25;font-weight:700;color:${C.text};">${escapeHtml(heading)}</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${C.text};">${escapeHtml(greeting)}</p>
          ${body.map((t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${C.text};">${multiline(t)}</p>`).join("")}
          ${noteHtml}
          ${buttonHtml}
        </td></tr>
        ${
          footnoteHtml
            ? `<tr><td style="padding:0 36px 28px;">${footnoteHtml}</td></tr>`
            : `<tr><td style="padding:0 36px 12px;font-size:0;line-height:0;">&nbsp;</td></tr>`
        }
        <tr><td style="border-top:1px solid ${C.rule};padding:20px 36px 24px;font-size:13px;line-height:1.6;color:${C.muted};">
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
