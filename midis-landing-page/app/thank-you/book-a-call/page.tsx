import type { Metadata } from "next";
import { Confirmation } from "@/components/thankyou/Confirmation";
import { thankYou } from "@/content/forms";

/**
 * The audit form's confirmation route.
 *
 * The PATH is MIDIS.pdf page 17's exactly — `/thank-you/book-a-call`. The
 * PDF writes the host as `midis.com`; the verified MIDIS domain is
 * `midis.in`, so the path is honoured and the host is the real one. See
 * docs/STATUS.md, open question 2.
 *
 * `robots: noindex` because a confirmation page has no business in search
 * results: it is meaningless without the submission that precedes it, and
 * indexing it would let people land here having submitted nothing. `follow`
 * stays on so the links out of it still pass.
 */

export const metadata: Metadata = {
  title: "Your Website Audit Request Is Confirmed",
  description:
    "Thank you for your website audit request. Book a short discovery call with the MIDIS team to discuss your goals and the right next steps.",
  alternates: { canonical: "/thank-you/book-a-call" },
  robots: { index: false, follow: true },
};

export default function BookACallPage() {
  return <Confirmation content={thankYou} />;
}
