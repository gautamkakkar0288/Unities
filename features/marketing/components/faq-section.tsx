import { ChevronDown } from "lucide-react"

import { faqs } from "@/lib/marketing/content"

import { Section } from "./section"

/**
 * Built on native details/summary rather than a JS accordion.
 *
 * It is keyboard accessible and screen-reader correct for free, works before
 * hydration, ships zero client JavaScript, and is findable by in-page browser
 * search. A custom accordion here would be strictly worse on every axis.
 */
export function FaqSection() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Questions students actually ask."
      className="border-border border-t"
    >
      <div className="max-w-readable divide-border divide-y">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-4">
            <summary className="text-h4 focus-visible:ring-ring/50 flex cursor-pointer items-center justify-between gap-4 rounded-md marker:content-none focus-visible:ring-3 focus-visible:outline-none">
              {faq.question}
              <ChevronDown
                aria-hidden="true"
                className="text-muted-foreground ease-standard size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="text-body text-muted-foreground mt-3">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
