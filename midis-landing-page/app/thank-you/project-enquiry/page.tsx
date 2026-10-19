import type { Metadata } from "next";
import { Confirmation } from "@/components/thankyou/Confirmation";
import { thankYouProject } from "@/content/forms";

/**
 * The project estimator's confirmation route.
 *
 * Separate from `/thank-you/book-a-call` so each form's confirmation says
 * the right thing: that page carries MIDIS.pdf's approved audit wording,
 * and showing it to someone who submitted a project enquiry would be plainly
 * wrong. Two static routes rather than one page switching on a query string,
 * which would make it dynamic under `cacheComponents` for no benefit.
 *
 * `noindex` for the same reason as its sibling — a confirmation page is
 * meaningless without the submission that precedes it.
 */

export const metadata: Metadata = {
  title: "Your Project Enquiry Is Confirmed",
  description:
    "Thank you for your project enquiry. Book a short discovery call with the MIDIS team to discuss your requirements, scope and next steps.",
  alternates: { canonical: "/thank-you/project-enquiry" },
  robots: { index: false, follow: true },
};

export default function ProjectEnquiryPage() {
  return <Confirmation content={thankYouProject} />;
}
