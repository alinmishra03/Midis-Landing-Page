/**
 * APPROVED LANDING PAGE COPY — MIDIS.pdf.
 *
 * Every headline, subheadline, description and CTA label in this file is the
 * client's approved wording, transcribed from MIDIS.pdf and NOT rewritten.
 * Where the page needed a short connective line that the PDF does not supply
 * (a step label, a cost-factor description), it is marked `/* SUPPORTING *​/`
 * so the distinction between approved copy and supporting copy stays visible
 * in review. See docs/content-provenance.md.
 */

/* ==========================================================================
   SECTION 1 — HERO  (MIDIS.pdf p.1)
   ========================================================================== */

export const hero = {
  headline: "Websites That Turn Visitors Into Customers.",
  subheadline:
    "MIDIS helps businesses build high-performing websites and digital experiences designed to strengthen their brand, attract the right audience, and drive measurable growth.",
  primaryCta: { label: "Get a Free Consultation", href: "#estimator" },
  secondaryCta: { label: "Explore Our Work", href: "#work" },
  supportingLine:
    "From strategy and design to development and optimisation, we help turn your digital vision into reality.",
} as const;

/* ==========================================================================
   SECTION 2 — TRUST & CREDIBILITY  (MIDIS.pdf p.2)
   ========================================================================== */

export const trust = {
  headline: "Your Digital Growth Partner",
  content:
    "Great digital experiences start with the right strategy. We combine creative thinking, technical expertise, and a business-first approach to build digital solutions that support your goals.",
} as const;

/* ==========================================================================
   SECTION 3 — FEATURED PROJECTS  (MIDIS.pdf p.3)
   ========================================================================== */

export const work = {
  headline: "Our Work Speaks for Itself",
  subheadline:
    "Explore digital experiences built to solve real business challenges, strengthen brands, and create better customer journeys.",
  /* One destination, three label lengths (MIDIS fix, 2026-10-22): the full
     p.3 line needs a ~346px button, which cannot sit on one line inside a
     narrow phone's gutters — so phones get a shorter label instead of a
     wrapped, double-height button. Work.tsx picks by breakpoint. */
  cta: {
    label: "Have a Project in Mind? Let's Talk.",
    labelShort: "Let's Talk About Your Project",
    labelCompact: "Discuss Your Project",
    href: "#estimator",
  },
} as const;

/* ==========================================================================
   SECTION 4 — CORE SERVICES  (MIDIS.pdf p.5–6)
   --------------------------------------------------------------------------
   `description` and `cta` are verbatim. `image` points at a licensed
   photograph (Pexels; see docs/asset-provenance.md), one per service and
   never repeated — the brief forbids repetitive stock imagery.
   ========================================================================== */

export interface Service {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly cta: string;
  readonly image: string;
  /** Describes the photograph, for review. Rendered decoratively (alt=""). */
  readonly imageSubject: string;
  /** Where the CTA goes on the existing MIDIS site. */
  readonly href: string;
}

export const servicesSection = {
  headline: "Digital Solutions Built Around Your Business Goals",
  subheadline:
    "Everything you need to build a stronger online presence and turn digital opportunities into business growth.",
} as const;

export const services: readonly Service[] = [
  {
    slug: "website-design-development",
    name: "Website Design & Development",
    description:
      "Modern, responsive websites that combine engaging design, seamless functionality, and clear conversion paths.",
    cta: "Explore Website Development",
    image: "/images/services/web-development.webp",
    imageSubject: "Developer workspace with code on a monitor",
    href: "https://www.midis.in/services/web-development",
  },
  {
    slug: "ui-ux-design",
    name: "UI/UX Design",
    description:
      "Intuitive digital experiences that help users navigate your website easily and take the next step with confidence.",
    cta: "Explore UI/UX Design",
    image: "/images/services/ui-ux-design.webp",
    imageSubject:
      "Sketchpad of interface wireframes beside a phone and keyboard",
    href: "https://www.midis.in/services/ui-ux-design",
  },
  {
    slug: "ecommerce-shopify",
    name: "E-commerce & Shopify Development",
    description:
      "Online stores designed to showcase your products, simplify shopping, and create a smoother path from discovery to checkout.",
    cta: "Build Your Online Store",
    image: "/images/services/shopify-development.webp",
    imageSubject: "Independent storefront set up for online order fulfilment",
    href: "https://www.midis.in/services/shopify-development",
  },
  {
    slug: "website-redesign",
    name: "Website Redesign",
    description:
      "Transform an outdated website into a modern, user-friendly experience aligned with your current brand and business objectives.",
    cta: "Redesign Your Website",
    image: "/images/services/website-redesign.webp",
    imageSubject: "Designer sketching a replacement layout at a desk",
    href: "https://www.midis.in/services/website-redesign",
  },
  {
    slug: "seo-organic-growth",
    name: "SEO & Organic Growth",
    description:
      "Improve your website's search visibility with a strategy focused on technical SEO, relevant content, and search intent.",
    cta: "Explore SEO Services",
    image: "/images/services/seo.webp",
    imageSubject: "Search performance dashboard on a laptop screen",
    href: "https://www.midis.in/services/seo",
  },
  {
    slug: "automation-optimisation",
    name: "Automation & Digital Optimisation",
    description:
      "Identify repetitive processes and opportunities to improve efficiency through suitable digital tools, integrations, and automation.",
    cta: "Explore Automation",
    image: "/images/services/automation.webp",
    imageSubject: "Operator working against an AI assistant on a laptop",
    href: "https://www.midis.in/services/ai-automation",
  },
];

/* ==========================================================================
   SECTION 5 — WEBSITE PROJECT ESTIMATOR  (MIDIS.pdf p.6–7)
   ========================================================================== */

export const estimator = {
  headline: "Let's Bring Your Website Idea to Life",
  subheadline:
    "Tell us a little about your project to help us understand your requirements and recommend the right approach.",
  cta: "Get My Project Estimate",
  supportingText:
    "Every project is different. Share your requirements and our team will help you understand the potential scope, timeline, and next steps.",
} as const;

/* ==========================================================================
   SECTION 6 — HOW IT WORKS  (MIDIS.pdf p.8)
   ========================================================================== */

export const process = {
  headline: "A Clear Process. From Idea to Launch.",
  subheadline:
    "We keep projects organised, collaborative, and focused on the outcome your business needs.",
  cta: { label: "Discuss Your Project", href: "#estimator" },
} as const;

export interface ProcessStep {
  readonly number: string;
  readonly title: string;
  readonly body: string;
}

export const processSteps: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    body: "We understand your business, audience, objectives, and project requirements.",
  },
  {
    number: "02",
    title: "Strategise & Design",
    body: "We define the structure and user journey, then develop a design that reflects your brand and supports your goals.",
  },
  {
    number: "03",
    title: "Develop",
    body: "We turn the approved design into a responsive, functional website built around your requirements.",
  },
  {
    number: "04",
    title: "Test & Refine",
    body: "We review usability, functionality, responsiveness, performance, and essential SEO elements before launch.",
  },
  {
    number: "05",
    title: "Launch & Grow",
    body: "We help prepare your website for launch and identify opportunities for ongoing improvement.",
  },
];

/* ==========================================================================
   SECTION 7 — CASE STUDIES  (MIDIS.pdf p.9)
   --------------------------------------------------------------------------
   MIDIS.pdf p.10 carries three testimonials, each explicitly labelled
   "Placeholder Only" with a developer note reading: "These testimonials are
   fictional examples for layout and design testing. Do not publish them as
   genuine customer reviews."

   They are therefore NOT in this file, and there is no testimonial component
   on the page. No approved client review has been supplied. The section
   renders the case-study framing below instead, which is the PDF's own
   alternative. See docs/open-questions.md, item 1.
   ========================================================================== */

export const caseStudies = {
  headline: "Built Around Real Business Goals",
  subheadline:
    "The best digital work combines a strong user experience with outcomes that matter to the business.",
  preview: {
    title: "From Website Challenges to a Better Digital Experience",
    body: "Discover how a well-planned website can improve usability, communicate value, and create a clearer journey from visitor to enquiry.",
  },
  cta: { label: "Explore Our Projects", href: "#work" },
} as const;

/**
 * The case-study structure MIDIS.pdf p.3 defines.
 *
 * Rendered as the framework MIDIS works to — NOT populated with outcomes.
 * The PDF's own template says "The Results: Add verified metrics". No
 * verified metric has been supplied for any project, so none is shown; the
 * section explains the method and sends the visitor to the live sites, which
 * are real and checkable. See docs/open-questions.md, item 3.
 */
export const caseStudyFramework = [
  {
    label: "The Challenge",
    /* SUPPORTING — the PDF gives the prompt question; this states it as the
       stage it describes, so the section reads as a method rather than a
       half-filled template. */
    body: "What the business needed to solve, in commercial terms rather than design ones.",
  },
  {
    label: "Our Approach",
    body: "How MIDIS planned the work — the research, the structure, and the decisions behind it.",
  },
  {
    label: "The Solution",
    body: "What was designed and developed, and why each part of it earns its place.",
  },
  {
    label: "The Results",
    body: "Measured against the goals set at the start. Published only once verified with the client.",
  },
] as const;

/* ==========================================================================
   SECTION 8 — PRICING & PROJECT SCOPE  (MIDIS.pdf p.11)
   --------------------------------------------------------------------------
   NO PRICES. MIDIS has no published, confirmed rate card, and the brief
   forbids inventing package prices. The section explains what moves the
   number and routes to the estimator, which is what the PDF's own
   subheadline describes.
   ========================================================================== */

export const pricing = {
  headline: "What Does a Website Project Cost?",
  subheadline:
    "Your investment depends on the scope, functionality, design requirements, integrations, and level of ongoing support needed.",
  cta: { label: "Get a Project Estimate", href: "#estimator" },
} as const;

/**
 * PRICING PACKAGE CARDS — the package-style presentation MIDIS.pdf p.11
 * shows as its visual reference, WITHOUT the reference's prices.
 *
 * The reference screenshot (another agency's "Website Design Pricing
 * Package" page) establishes the LAYOUT the client wants: a prominent
 * multi-column package composition with clear plan hierarchy. Its prices,
 * plan names and feature claims belong to that other site and are not
 * reproduced.
 *
 * MIDIS has no approved rate card, so these cards are SCOPE TIERS, not
 * offers:
 *
 *   - The three tiers are the PDF's own project types — the p.7 estimator
 *     reference's "Landing Page / Business Website / E-commerce" and the
 *     estimator's approved "What do you need?" options. No package brand
 *     name was invented.
 *   - `scope` lines are SUPPORTING copy describing what that kind of
 *     project typically involves, phrased with the same hedging as the
 *     approved service descriptions and FAQ answers they are drawn from.
 *     Nothing is promised as an included deliverable of a fixed package.
 *   - Where the reference shows a price, these cards say "Tailored
 *     estimate" and route to the estimator — which is the PDF's own
 *     developer-note behaviour when no pricing model exists, and this
 *     section's approved CTA ("Get a Project Estimate").
 *
 * If MIDIS later approves real packages, replace `priceNote` with the
 * confirmed figures and the layout already holds them.
 */
export interface PricingTier {
  readonly name: string;
  readonly description: string;
  /** Replaces the price slot until approved figures exist. */
  readonly priceLabel: string;
  readonly priceNote: string;
  /** What this kind of project typically covers. Hedged, not promised. */
  readonly scope: readonly string[];
  /** Visually emphasised column, as the reference's hierarchy shows. */
  readonly featured?: boolean;
}

export const pricingTiers: readonly PricingTier[] = [
  {
    name: "Landing Page",
    description:
      "A focused one-page site built to present a single offer clearly and turn visitors into enquiries.",
    priceLabel: "Tailored estimate",
    priceNote: "Scoped with you before any figure is quoted.",
    scope: [
      "Conversion-focused page structure",
      "Responsive design across devices",
      "Essential SEO foundations",
      "Enquiry and contact integration",
    ],
  },
  {
    name: "Business Website",
    description:
      "A multi-page website that presents your services, strengthens your brand, and guides visitors to get in touch.",
    priceLabel: "Tailored estimate",
    priceNote: "Scoped with you before any figure is quoted.",
    scope: [
      "Multi-page structure and user journey",
      "Design aligned with your brand",
      "CMS options for content updates",
      "SEO foundations and analytics",
    ],
    featured: true,
  },
  {
    name: "E-commerce & Custom",
    description:
      "An online store or custom build with the functionality and integrations your business needs.",
    priceLabel: "Tailored estimate",
    priceNote: "Scoped with you before any figure is quoted.",
    scope: [
      "Storefront or custom functionality",
      "Payment and system integrations",
      "Smoother product-to-checkout journeys",
      "Testing and refinement before launch",
    ],
  },
] as const;

/**
 * SUPPORTING — the honest line the package grid stands on. States plainly
 * that MIDIS quotes per project, so the absence of figures reads as a
 * policy rather than an unfinished table.
 */
export const pricingTiersNote =
  "MIDIS doesn't sell one-size-fits-all packages. Every project is scoped against your actual requirements, and the proposal breaks down exactly what drives the number.";

/**
 * The five factors are the PDF subheadline's own list, split out.
 * `body` is SUPPORTING copy: it explains each factor without quoting a figure
 * or implying a band.
 */
export const pricingFactors = [
  {
    number: "01",
    title: "Project scope",
    body: "How many pages, how much of the content already exists, and whether the site serves one audience or several.",
  },
  {
    number: "02",
    title: "Design requirements",
    body: "Whether the work follows an existing brand or establishes a new visual system, and how much is bespoke rather than templated.",
  },
  {
    number: "03",
    title: "Website functionality",
    body: "Booking, accounts, search, multi-language, a storefront — anything the site has to do beyond presenting information.",
  },
  {
    number: "04",
    title: "Integrations",
    body: "The systems the site has to talk to: a CRM, a payment provider, inventory, analytics, or an internal tool with an API.",
  },
  {
    number: "05",
    title: "Ongoing support",
    body: "Whether the engagement ends at launch or continues into maintenance, measurement, and continuous improvement.",
  },
] as const;

/* ==========================================================================
   SECTION 9 — FAQs  (MIDIS.pdf p.12)
   --------------------------------------------------------------------------
   All seven questions and answers, verbatim. The answers are deliberately
   qualified ("should be", "can be discussed") in the source, and that hedging
   is preserved — tightening it would turn a careful statement into a
   guarantee MIDIS has not made.
   ========================================================================== */

/**
 * SUPPORTING — MIDIS.pdf heads this section only "9. FAQs" and supplies no
 * headline or subheadline for it. Every other section on the page has both,
 * so one is written here rather than leaving a bare list. The questions and
 * answers themselves are untouched.
 */
export const faqSection = {
  headline: "Answers Before You Ask",
  subheadline: "The questions businesses raise most often, answered plainly.",
} as const;

export interface Faq {
  readonly question: string;
  readonly answer: string;
}

export const faqs: readonly Faq[] = [
  {
    question: "How much does a website cost?",
    answer:
      "The cost depends on the size and complexity of your project. Share your requirements with us to discuss an appropriate scope and estimate.",
  },
  {
    question: "How long does website development take?",
    answer:
      "Timelines depend on the number of pages, functionality, content readiness, and feedback cycles. We will agree on a timeline after understanding your project.",
  },
  {
    question: "Will my website work on mobile devices?",
    answer:
      "Our website projects should be planned for responsive experiences across mobile, tablet, and desktop screens.",
  },
  {
    question: "Can you redesign my existing website?",
    answer:
      "Yes, MIDIS can position website redesign as a service for businesses looking to improve their existing website's design, structure, and user experience.",
  },
  {
    question: "Will my website be SEO-friendly?",
    answer:
      "We can plan essential SEO foundations into the project, including page structure, metadata, internal linking, and technical considerations. SEO performance also depends on content, competition, and ongoing optimisation.",
  },
  {
    question: "Can I update the website myself?",
    answer:
      "CMS options can be discussed based on your website requirements so your team can manage suitable content updates.",
  },
  {
    question: "Do you provide support after launch?",
    answer:
      "Post-launch support and ongoing maintenance should be discussed according to the service packages MIDIS offers.",
  },
];

/* ==========================================================================
   SECTION 10 — FINAL CTA  (MIDIS.pdf p.13)
   ========================================================================== */

export const finalCta = {
  headline: "Ready to Build Something Better?",
  subheadline:
    "Let's discuss your goals, explore the right digital solution, and plan the next step for your business.",
  primaryCta: { label: "Start Your Project", href: "#estimator" },
  secondaryCta: { label: "Book a Consultation", href: "/free-website-audit" },
} as const;
