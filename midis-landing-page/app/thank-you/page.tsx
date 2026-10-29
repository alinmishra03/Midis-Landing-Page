import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsultationThankYou } from "@/components/thankyou/ConsultationThankYou";

/**
 * The consultation form's confirmation route (MIDIS brief, 2026-10-29).
 *
 * Every successful ConsultationForm submission — the homepage hero, the
 * lead popup, the audit page's in-place form — navigates here client-side.
 * The site's own header and footer frame it, so it reads as a page of the
 * site rather than a dead end. The lead popup never opens on `/thank-you`
 * routes (components/popups/LeadPopups.tsx).
 *
 * Static: it depends on nothing from the submission, so a refresh or a
 * direct visit renders the same page rather than a 404.
 *
 * `noindex` for the same reason as its siblings under /thank-you/ — a
 * confirmation page is meaningless without the submission before it.
 * The title resolves through the root template to "Thank You | MIDIS".
 */

export const metadata: Metadata = {
  title: "Thank You",
  description:
    "Thank you for your interest in MIDIS. Schedule your free 30-minute consultation with our team.",
  alternates: { canonical: "/thank-you" },
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <>
      <Header />
      <ConsultationThankYou />
      <Footer />
    </>
  );
}
