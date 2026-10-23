import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/layout/Logo";
import { WebsiteAuditTool } from "@/components/forms/WebsiteAuditTool";
import { auditIntro } from "@/content/forms";
import { site } from "@/content/site";

/**
 * PHASE 4 — the Free Website Audit route.
 *
 * A dedicated conversion page, not a section bolted onto the landing page.
 * It carries its own cut-down header: the wordmark and a single way back,
 * with no section navigation at all. Someone who has arrived here is one
 * action away from converting, and a nav bar offering five other
 * destinations is an invitation to leave.
 *
 * The dark intro panel is MIDIS.pdf page 15's own design: heading,
 * subheading, and the three benefit lines. Those lines are the PDF's
 * wording, and they describe what the audit covers rather than promising an
 * outcome — "Personalised recommendations", not "a 40% conversion lift".
 *
 * THE FORM (2026-10-23) is the automated Free Website Audit tool
 * (components/forms/WebsiteAuditTool.tsx): a real Lighthouse + page-check
 * audit, then contact details, then the results and the emailed report.
 *
 * METADATA. Its own title, description and canonical, so it does not
 * duplicate the landing page's. `robots: index` stays on — this is a real
 * landing destination worth ranking for "free website audit".
 */

const title = "Get Your Free Website Audit";
const description =
  "Run a free website audit with MIDIS. Get your site's Google Lighthouse scores for performance, SEO, accessibility and best practices, plus a full PDF report by email.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/free-website-audit" },
  openGraph: {
    title: `${title} | MIDIS`,
    description,
    url: `${site.url}/free-website-audit`,
    images: [
      {
        url: "/images/work/portfolio.jpg",
        width: 1800,
        height: 1125,
        alt: "Website projects designed and developed by MIDIS",
      },
    ],
  },
  twitter: {
    title: `${title} | MIDIS`,
    description,
    images: ["/images/work/portfolio.jpg"],
  },
};

export default function FreeWebsiteAuditPage() {
  return (
    <>
      {/* ---- minimal header ---- */}
      <header className="border-b border-line bg-paper">
        <div className="container-site flex h-[var(--header-h)] items-center justify-between gap-6">
          {/* Both links are given a 44px-tall flex box. The logo is only
              28px and the text link 20px; without this the header's two
              targets are below the 44px minimum on touch. */}
          <Link
            href="/"
            aria-label="MIDIS — home"
            className="flex min-h-11 shrink-0 items-center"
          >
            <Logo />
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            <span aria-hidden="true">←</span>&nbsp;Back to the site
          </Link>
        </div>
      </header>

      <main id="main" className="bg-paper py-10 sm:py-16">
        <div className="container-site">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
            {/* ---- intro panel (MIDIS.pdf p.15) ---- */}
            <div className="lg:sticky lg:top-10">
              <div className="on-dark rounded-2xl bg-ink p-6 text-white sm:p-8">
                <h1 className="text-[length:var(--text-display-md)] leading-[1.08]">
                  {auditIntro.heading}
                </h1>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-dark">
                  {auditIntro.subheading}
                </p>

                <ul className="mt-7 flex flex-col gap-3.5">
                  {auditIntro.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <svg
                        viewBox="0 0 16 16"
                        width="18"
                        height="18"
                        aria-hidden="true"
                        className="mt-px shrink-0 text-accent"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <path
                          d="M4.9 8.2l2.1 2.1 4.1-4.4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm font-medium leading-snug">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-muted">
                Prefer to talk it through?{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-medium text-accent-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
                >
                  {site.email}
                </a>
              </p>
            </div>

            {/* ---- the form ---- */}
            <WebsiteAuditTool />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
