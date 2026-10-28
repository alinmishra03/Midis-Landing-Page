/**
 * FORM SCHEMAS — shared by the client components and the server route.
 *
 * Both forms are defined once here so the browser and the API can never
 * disagree about what a valid option is. The route handler validates against
 * these same lists; it does not trust anything the client posts.
 *
 * WHERE THESE NOW DIVERGE FROM MIDIS.pdf
 * --------------------------------------
 * The forms were originally transcribed field-for-field from the PDF. MIDIS
 * then asked for them to be shortened to raise completion, so the following
 * APPROVED fields were deliberately dropped. Recorded here because they were
 * client-approved content, and removing them was a decision rather than an
 * oversight:
 *
 *   Estimator  "How many pages do you need?"   (p.6) — scoping detail the
 *                                               consultation covers better
 *              "When would you like to launch?" (p.6) — removed outright
 *   Audit      "What is your main goal?"        (p.16) — overlapped the
 *                                               service question it sat next to
 *              separate First/Last name         (p.15) — merged into one field
 *   Both       budget bands "Under $1,000" and "$10,000+" (p.16)
 *
 * Everything still present is the PDF's own wording. Nothing was invented
 * and no new question was added.
 *
 * CURRENCY — STILL FLAGGED. The remaining bands are the PDF's USD values.
 * MIDIS is India-based (registered in Punjab; published lines are +91 and
 * +1) and its internal cost references are INR. Confirm USD suits the
 * intended audience before launch. See docs/STATUS.md.
 */

/* ==========================================================================
   PROJECT ESTIMATOR  (MIDIS.pdf p.6)
   ========================================================================== */

/** APPROVED — MIDIS.pdf p.6. */
export const PROJECT_TYPES = [
  "New Website",
  "Redesign",
  "E-commerce",
  "Landing Page",
  "Other",
] as const;

/** SUPPORTING — the PDF asks the question but lists no options. */
export const EXISTING_SITE = [
  "Yes, and I want to keep it",
  "Yes, and I want to replace it",
  "No, this would be our first site",
] as const;

/* ==========================================================================
   FREE WEBSITE AUDIT  (MIDIS.pdf p.15–16)
   ========================================================================== */

/** APPROVED — MIDIS.pdf p.15. */
export const COUNTRIES = [
  "United States",
  "Australia",
  "United Kingdom",
  "Other",
] as const;

/**
 * APPROVED — MIDIS.pdf p.15.
 *
 * The PDF's screenshot is cut off by a scroll indicator after "SEO and
 * conversion optimisation". The five visible options are reproduced exactly;
 * none has been added. If a sixth exists below the fold, it is missing here.
 * See docs/STATUS.md.
 */
export const AUDIT_SERVICES = [
  "Website audit",
  "New website development",
  "Website redesign",
  "E-commerce / Shopify",
  "SEO and conversion optimisation",
] as const;

/**
 * Four bands, shared by both forms.
 *
 * The PDF's six (p.16) minus "Under $1,000" and "$10,000+", on MIDIS's
 * instruction. Four reads as a quick choice rather than a questionnaire, and
 * an even count lays out cleanly in the two-column grid from `sm` up.
 */
export const BUDGETS = [
  "$1,000–$3,000",
  "$3,000–$5,000",
  "$5,000–$10,000",
  "Not sure yet",
] as const;

/* ==========================================================================
   Consent copy — MIDIS.pdf p.16, verbatim.
   ========================================================================== */

export const consent = {
  /** Required. Never pre-ticked. */
  required:
    "I agree to receive WhatsApp messages from MIDIS about my request and relevant follow-ups. I can opt out at any time.",
  /** Optional, and separate. Never pre-ticked. */
  marketing:
    "I would like to receive marketing emails and website improvement tips from MIDIS. I can unsubscribe at any time.",
  /** The fine print beneath both. */
  notice:
    "By submitting, you agree that MIDIS may use your details to respond to your request, as described in its Privacy Policy. Marketing permissions are optional and separate.",
} as const;

/** The audit page's header block — MIDIS.pdf p.15, verbatim. */
export const auditIntro = {
  heading: "Get Your Free Website Audit",
  subheading:
    "Discover opportunities to improve your website, user experience, and lead generation.",
  bullets: [
    "Personalised recommendations",
    "Conversion and UX improvement opportunities",
    "Clear next steps for your website",
  ],
  formHeading: "Tell us about your project",
  formIntro: "Complete the form below to request your audit.",
  submitLabel: "Get My Free Website Audit",
} as const;

/* ==========================================================================
   THANK-YOU / BOOKING  (MIDIS.pdf p.17)
   ========================================================================== */

export const thankYou = {
  heading: "Your Website Audit Request Is Confirmed!",
  intro:
    "Thank you for reaching out to MIDIS. Let's take the next step and understand your business goals.",
  nextStepsHeading: "What happens next?",
  steps: [
    {
      title: "We review your website",
      body: "We identify relevant opportunities based on your request.",
    },
    {
      title: "We discuss your goals",
      body: "Book a short discovery call with our team.",
    },
    {
      title: "We recommend next steps",
      body: "Discuss the right approach for your website and business.",
    },
  ],
  bookingHeading: "Book Your Free Discovery Call",
  bookingIntro:
    "Choose a convenient time in your local time zone. The call will help us understand your requirements and see whether we're a good fit.",
  bookingCardHeading: "Select a date and time",
  bookingCta: "Choose a Meeting Time",
  duration: "Suggested meeting duration: 20–30 minutes.",
  fallback:
    "Not ready to book? That's okay. Check your inbox for confirmation and next steps.",
} as const;

/**
 * The estimator's confirmation copy.
 *
 * SUPPORTING. MIDIS.pdf page 17 supplies one confirmation page, written for
 * the audit form ("Your Website Audit Request Is Confirmed!"). The estimator
 * needs its own, because showing a project enquirer a page about a website
 * audit would be wrong. This mirrors the approved page's structure and tone
 * exactly and changes only what has to change — the heading, the opening
 * line, and the first of the three steps.
 *
 * It lives at a separate route rather than being switched on a query string:
 * two static pages prerender, whereas reading `searchParams` would make the
 * page dynamic under `cacheComponents` for no benefit.
 */
export const thankYouProject = {
  heading: "Your Project Enquiry Is Confirmed!",
  intro:
    "Thank you for reaching out to MIDIS. Let's take the next step and understand your business goals.",
  nextStepsHeading: "What happens next?",
  steps: [
    {
      title: "We review your requirements",
      /* No longer mentions pages or timeline: the estimator stopped asking
         for either, so promising to review them would describe information
         the visitor was never given a chance to supply. */
      body: "We look at the project type, budget and requirements you shared.",
    },
    {
      title: "We discuss your goals",
      body: "Book a short discovery call with our team.",
    },
    {
      title: "We recommend next steps",
      body: "Discuss the right approach for your website and business.",
    },
  ],
  bookingHeading: thankYou.bookingHeading,
  bookingIntro: thankYou.bookingIntro,
  bookingCardHeading: thankYou.bookingCardHeading,
  bookingCta: thankYou.bookingCta,
  duration: thankYou.duration,
  fallback: thankYou.fallback,
} as const;

export type ThankYouContent = typeof thankYou | typeof thankYouProject;

/* ==========================================================================
   THE CONSULTATION FORM  (MIDIS client-approved brief, 2026-10-28)
   --------------------------------------------------------------------------
   One single-step form, used verbatim by the homepage hero AND the lead
   popup (components/forms/ConsultationForm.tsx). It replaced the four-step
   Project Estimator. Every string below is the client's exact wording —
   do not edit without their approval.
   ========================================================================== */

/** APPROVED — "What do you need help with?", in this order, no others. */
export const CONSULTATION_SERVICES = [
  "New Website Development",
  "Website Redesign",
  "E-commerce Website",
  "Landing Page Development",
  "Not Sure Yet",
] as const;

export type ConsultationService = (typeof CONSULTATION_SERVICES)[number];

/** The client's HubSpot meetings page — the thank-you screen's only CTA. */
export const MEETING_URL = "https://meetings-na2.hubspot.com/mohit-mayank";

export const consultationForm = {
  heading: "Let’s Build a Website That Grows Your Business",
  description:
    "Looking to build a new website or improve your existing one? Tell us a little about your requirements, and let’s explore how MIDIS can help your business grow.",
  fields: {
    name: { label: "Your Name", placeholder: "Enter your name" },
    email: { label: "Business Email", placeholder: "Enter your business email" },
    phone: {
      label: "Phone Number",
      placeholder: "Enter your phone number with country code",
    },
    website: { label: "Website URL (Optional)", placeholder: "Enter your website URL" },
    service: { label: "What do you need help with?" },
  },
  submit: "Get a Free Consultation",
  consent:
    "By submitting, you agree that MIDIS may use your details to contact you about our services. No commitment required.",
  thankYou: {
    heading: "Thank You for Your Interest in MIDIS!",
    confirmation: [
      "Your request has been received successfully.",
      "Let’s take the next step toward building a website that helps your business grow.",
    ],
    meetingHeading: "Schedule Your Free Consultation",
    meetingDescription:
      "Choose a convenient date and time to discuss your business goals, website requirements, and how MIDIS can help.",
    meetingCta: "Book Your Free 20-Minute Meeting",
    followUp: [
      "Prefer not to schedule right now? No problem! Our team may follow up using the contact details you provided.",
      "We look forward to connecting with you!",
    ],
  },
} as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type AuditService = (typeof AUDIT_SERVICES)[number];
export type Budget = (typeof BUDGETS)[number];
