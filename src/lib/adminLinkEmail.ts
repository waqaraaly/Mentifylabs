/**
 * The email Super Admin triggers for a practitioner. Someone who has never signed in is being invited; someone who already
 * has an account is being sent a way to choose a new password. The two read differently, so they are written apart.
 */
export function adminLinkEmail(opts: { invite: boolean; link: string; days: number; name: string }) {
  const footnote = `The link works once and expires in ${opts.days} days.`;
  if (opts.invite) {
    return {
      subject: "You've been invited to MentifyLabs",
      greeting: `Hi ${opts.name},`,
      content: {
        eyebrow: "Invitation",
        heading: "You've been invited to MentifyLabs",
        body: [
          "You've been added as a practitioner on MentifyLabs. Accept the invitation to create your password and get access to your account.",
        ],
        button: { label: "Accept invitation", url: opts.link },
        footnote,
      },
    };
  }
  return {
    subject: "Reset your MentifyLabs password",
    greeting: `Hi ${opts.name},`,
    content: {
      eyebrow: "Password",
      heading: "Choose a new password",
      body: ["A Super Admin sent you this link so you can choose a new password and sign in."],
      button: { label: "Choose a new password", url: opts.link },
      footnote,
    },
  };
}
