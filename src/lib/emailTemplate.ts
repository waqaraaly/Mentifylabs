/** Brand colours from globals.css, inlined because email clients ignore stylesheets and CSS variables. */
const C = {
  page: "#f6f4ea", // --background, the oat page
  card: "#ffffff",
  text: "#2e3522", // --foreground, deep moss ink
  muted: "#6f7257", // --muted
  rule: "#e6e4cf", // --border
  moss: "#3f4e30", // --hero, the deepest moss: the header band and the button
  leaf: "#6e8356", // --primary, the brand green
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

  const para = (t: string) => `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${C.text};">${multiline(t)}</p>`;

  // A one-time code reads better set large on its own than as a quoted sentence.
  const isCode = !!note && /^\d{4,8}$/.test(note.text.trim());
  const noteHtml = note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 30px;"><tr>
        <td style="border-left:2px solid ${C.leaf};padding:2px 0 2px 18px;">
          <div style="font-size:13px;line-height:1.4;color:${C.muted};margin-bottom:${isCode ? 8 : 5}px;">${escapeHtml(note.label)}</div>
          ${
            isCode
              ? `<div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;line-height:1.1;font-weight:600;letter-spacing:.16em;color:${C.text};">${escapeHtml(note.text.trim())}</div>`
              : `<div style="font-family:${SERIF};font-size:17px;line-height:1.6;color:${C.text};">${multiline(note.text)}</div>`
          }
        </td></tr></table>`
    : "";

  const buttonHtml = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 30px;"><tr>
        <td style="background:${C.moss};border-radius:5px;">
          <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(button.label)}</a>
        </td></tr></table>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:0 0 6px;font-size:14px;line-height:1.65;color:${C.muted};">${multiline(footnote)}</p>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${SANS};color:${C.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(body[0] ?? heading)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
    <tr><td align="center" style="padding:40px 16px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <tr><td style="padding:0 2px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-family:${SERIF};font-size:21px;line-height:1;color:${C.moss};"><span style="font-weight:700;">Mentify</span>Labs</td>
            <td align="right" style="font-size:13px;line-height:1;color:${C.muted};">${escapeHtml(eyebrow)}</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:${C.card};border:1px solid ${C.rule};border-radius:6px;padding:40px 40px 22px;">
          <h1 style="margin:0 0 26px;font-family:${SERIF};font-size:26px;line-height:1.3;font-weight:400;color:${C.text};">${escapeHtml(heading)}</h1>
          ${para(greeting)}
          ${body.map(para).join("")}
          ${noteHtml}
          ${buttonHtml}
          ${footnoteHtml}
        </td></tr>
        <tr><td style="padding:20px 2px 0;font-size:13px;line-height:1.65;color:${C.muted};">
          The MentifyLabs team<br>
          You are getting this because of activity on your MentifyLabs account.
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
