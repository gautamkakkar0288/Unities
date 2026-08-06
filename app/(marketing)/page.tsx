import type { Metadata } from "next"

import { AudienceSections } from "@/features/marketing/components/audience-sections"
import { FaqSection } from "@/features/marketing/components/faq-section"
import { FeatureGrid } from "@/features/marketing/components/feature-grid"
import { FinalCta } from "@/features/marketing/components/final-cta"
import { Hero } from "@/features/marketing/components/hero"
import { HowItWorks } from "@/features/marketing/components/how-it-works"
import { ProblemSection } from "@/features/marketing/components/problem-section"
import { brand, faqs } from "@/lib/marketing/content"

export const metadata: Metadata = {
  // Root layout owns the title default; the landing page is the canonical root.
  alternates: { canonical: "/" },
}

/**
 * FAQPage structured data, generated from the same content module the page
 * renders. Deriving it means the markup and the schema can never disagree.
 */
function FaqStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }

  return (
    <script
      type="application/ld+json"
      // Content is authored in-repo, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function OrganizationStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    description: brand.description,
    email: brand.email,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <FeatureGrid />
      <HowItWorks />
      <AudienceSections />
      <FaqSection />
      <FinalCta />
      <OrganizationStructuredData />
      <FaqStructuredData />
    </>
  )
}
