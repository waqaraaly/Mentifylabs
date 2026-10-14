/**
 * The public feature pages: one entry per page at /features/<slug>, in the order the Features menu lists them.
 * Each page starts with the problem a practitioner already has, then shows how the feature answers it.
 * Every line here describes what the app does today; keep it that way when the app changes.
 */
export type FeatureSlug =
  | "personal-link"
  | "open-times"
  | "booking-requests"
  | "sessions"
  | "verified-badge"
  | "colour-themes"
  | "page-stats"
  | "privacy-and-control";

export interface FeaturePage {
  slug: FeatureSlug;
  /** The name in the menu, the breadcrumb and the cards that link to it. */
  name: string;
  /** One short line under the name in the menu. */
  blurb: string;
  /** The question the page opens with, in two parts; the second is set lighter. */
  question: [string, string];
  /** The answer beside the picture, and the sentence in it that gets the highlight. */
  answer: string;
  emphasis: string;
  /** The usual way of doing it, shown crossed out above the picture. */
  before: string[];
  /** Three things people ask about this feature. */
  faqs: { q: string; a: string }[];
  /** Search-result description. */
  description: string;
}

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: "personal-link",
    name: "Your personal link",
    blurb: "One address for your whole practice",
    question: ["Still sending clients", "five different links?"],
    answer: "Your personal link opens one page with your work, your fees and your open times.",
    emphasis: "One address to share, everywhere.",
    before: ["Here is my Instagram…", "My fees are on my website", "Message me for my times"],
    faqs: [
      { q: "Can I choose my own address?", a: "Yes. Type the address you want and we check it is free as you type." },
      { q: "Can I change it later?", a: "Yes. You can change your link from your profile in the portal." },
      { q: "Where can I share it?", a: "Anywhere you can paste a link: your bio, chats, email signature or a printed card." },
    ],
    description: "Choose a short, personal address for your practice and share it anywhere. It opens your page with your work and your open times.",
  },
  {
    slug: "open-times",
    name: "Open times",
    blurb: "Weekly hours and one-off dates",
    question: ["Answering “are you free?”", "all day long?"],
    answer: "Set your weekly hours once, and add special dates or days away when you need to.",
    emphasis: "Clients only see the times you have opened.",
    before: ["Are you free on Tuesday?", "What about next week?", "Do you have any evenings?"],
    faqs: [
      { q: "Do I have to set times every week?", a: "No. Your weekly hours repeat until you change them, and you can add one-off dates on top." },
      { q: "What about holidays?", a: "Mark the dates you are away as unavailable, and nobody can pick them." },
      { q: "What if my client is in another country?", a: "Online times show in the client's own time zone, so nobody has to work it out." },
    ],
    description: "Set weekly hours, add special dates and block days away. Clients see only the times you open, in their own time zone for online sessions.",
  },
  {
    slug: "booking-requests",
    name: "Booking requests",
    blurb: "Clients ask for a time, no account needed",
    question: ["Tired of arranging times", "over chat?"],
    answer: "With booking requests, a client picks one of your open times and sends a request.",
    emphasis: "Nothing is booked until you accept.",
    before: ["Are you free this week?", "Which day suits you?", "Thursday evening?"],
    faqs: [
      { q: "Do clients need an account?", a: "No. They choose a time and leave their details. That is all it takes to ask." },
      { q: "What if the time doesn't suit me?", a: "Decline it, or suggest a different time from your portal." },
      { q: "Who sees their message?", a: "Only you. A client's note about why they are reaching out stays private." },
    ],
    description: "Clients pick one of your open times and send a request without making an account. Nothing is booked until you accept.",
  },
  {
    slug: "sessions",
    name: "Sessions",
    blurb: "Every booked session in one list",
    question: ["Keeping track of sessions", "in a notebook?"],
    answer: "Every request you accept becomes a session in one list,",
    emphasis: "sorted into upcoming, overdue, completed and cancelled.",
    before: ["Wed 5pm, Ayesha? (check chat)", "Screenshot of a booking", "A reminder on your phone"],
    faqs: [
      { q: "Can I move a session?", a: "Yes. Reschedule it to another time, or cancel it, from the same list." },
      { q: "Can I add a session booked another way?", a: "Yes. Schedule it yourself in the portal so it sits with the rest." },
      { q: "Can I find an old session?", a: "Search your sessions, or open the completed and cancelled lists." },
    ],
    description: "Every booked session in one list, sorted into upcoming, overdue, completed and cancelled, with rescheduling built in.",
  },
  {
    slug: "verified-badge",
    name: "Verified badge",
    blurb: "Checked by a person on our team",
    question: ["How do clients know", "you are qualified?"],
    answer: "Upload a license, degree or membership once.",
    emphasis: "A person on our team checks it, and your page shows a verified badge.",
    before: ["Can you send your certificates?", "Are you licensed?", "Where did you train?"],
    faqs: [
      { q: "Who checks my documents?", a: "A person on our team reads them. Nothing is approved automatically." },
      { q: "Do clients see my documents?", a: "No. Clients see the badge next to your name, never the files." },
      { q: "How will I know it is done?", a: "We email you when your documents are reviewed." },
    ],
    description: "Upload a license, degree or membership. Our team reviews it and a verified badge appears next to your name.",
  },
  {
    slug: "colour-themes",
    name: "Colour themes",
    blurb: "Light, calm colours for your page",
    question: ["Does your page", "feel like you?"],
    answer: "Choose from a set of light, calm colour themes.",
    emphasis: "Your frame, buttons, highlights and contact card change together.",
    before: ["The same template as everyone", "Colours you can't change", "A cold, clinical look"],
    faqs: [
      { q: "Can I see it before I save?", a: "Yes. Try a theme in the portal and preview your page in it first." },
      { q: "Will my page stay easy to read?", a: "Yes. Every theme keeps text, buttons and links easy to read." },
      { q: "Can I change it later?", a: "Any time. Your live page updates when you save." },
    ],
    description: "Choose a light, calm colour theme for your page. The frame, buttons, highlights and contact card all change together.",
  },
  {
    slug: "page-stats",
    name: "Page stats",
    blurb: "Views, visitors and where they come from",
    question: ["Is your link", "actually working?"],
    answer: "See your profile views, visitors and appointment requests,",
    emphasis: "and where your visitors found your link.",
    before: ["No idea who visits", "Guessing which post worked", "Can't tell if anyone asked"],
    faqs: [
      { q: "What do the stats show?", a: "Profile views, visitors, appointment requests and the share of visitors who asked for a time." },
      { q: "Can I see where visitors come from?", a: "Yes. The places they found your link, and the countries they visit from." },
      { q: "Can I look at a past month?", a: "Yes. Choose the range of dates you want to see." },
    ],
    description: "See profile views, visitors, appointment requests and where your visitors come from.",
  },
  {
    slug: "privacy-and-control",
    name: "Privacy and control",
    blurb: "Pause, go offline, sign in safely",
    question: ["Need a break", "without disappearing?"],
    answer: "Pause new bookings or take your page offline, and switch back whenever you like.",
    emphasis: "Private details never reach your public page.",
    before: ["Deleting your profile", "Messaging every client", "Your phone number on show"],
    faqs: [
      { q: "What happens when I pause bookings?", a: "Your page stays up, but nobody can request a time until you switch bookings back on." },
      { q: "Can I keep contact details private?", a: "Yes. Mark any detail as private and it never appears on your public page." },
      { q: "How do I protect my account?", a: "Turn on two-step sign-in, and a code is sent to your email each time you sign in." },
    ],
    description: "Pause bookings, take your page offline, keep contact details private and use two-step sign-in.",
  },
];

export function featureBySlug(slug: string): FeaturePage | undefined {
  return FEATURE_PAGES.find((f) => f.slug === slug);
}
