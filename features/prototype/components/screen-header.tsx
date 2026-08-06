import { Badge } from "@/components/ui/badge"

/**
 * Heading for a prototype screen.
 *
 * Owns the page `h1` so every screen has exactly one, and states which phase
 * makes the screen real. The optional `notes` list is the honest part: it names
 * what is deliberately not wired up, so a review conversation is about the
 * design rather than about why a button did nothing.
 */
export function ScreenHeader({
  title,
  description,
  phase,
  notes,
}: {
  title: string
  description: string
  phase: string
  notes?: string[]
}) {
  return (
    <header className="mb-8 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand">{phase}</Badge>
        <Badge variant="outline">Fixture data</Badge>
      </div>
      <h1 className="text-h2">{title}</h1>
      <p className="max-w-readable text-body-sm text-muted-foreground">
        {description}
      </p>
      {notes && notes.length > 0 && (
        <details className="max-w-readable rounded-lg border border-border bg-muted/40 px-3 py-2">
          <summary className="cursor-pointer list-none text-caption font-medium text-muted-foreground">
            Not wired up on this screen ({notes.length})
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-caption text-muted-foreground">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </header>
  )
}
