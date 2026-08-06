import { problems } from "@/lib/marketing/content"

import { Section } from "./section"

export function ProblemSection() {
  return (
    <Section
      id="problem"
      eyebrow="The problem"
      title="Campus life is scattered across a dozen group chats."
      description="Every student has missed something they would have loved to attend. Not because they were not interested, but because nobody told them in time."
    >
      <dl className="grid gap-6 sm:grid-cols-3">
        {problems.map((problem) => (
          <div
            key={problem.title}
            className="flex flex-col gap-2 border-l-2 border-border pl-4"
          >
            <dt className="text-h4">{problem.title}</dt>
            <dd className="text-body-sm text-muted-foreground">
              {problem.description}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
