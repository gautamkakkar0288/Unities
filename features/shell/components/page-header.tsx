import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

/**
 * Standard heading block for app pages.
 *
 * Every page inside the shell answers "what am I looking at?" the same way, in
 * the same position, per the information hierarchy rule in
 * docs/UX/00-Information-Architecture.md. Owning the page h1 here also keeps
 * heading order correct across every feature that follows.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2">{title}</h1>
        {description && (
          <p className="max-w-readable text-body text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
