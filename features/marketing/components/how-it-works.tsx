import { steps } from "@/lib/marketing/content"

import { Section } from "./section"

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Three steps, about a minute."
    >
      <ol className="grid gap-6 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-full border border-primary-border bg-primary-subtle text-body-sm font-semibold text-primary"
              data-numeric
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <h3 className="text-h4">{step.title}</h3>
            <p className="text-body-sm text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
