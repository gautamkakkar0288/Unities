import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { prototypeRoutesEnabled } from "@/lib/prototype/access"

/**
 * The design-system gallery is an internal development tool, not a page of the
 * product. It is reachable in development and on previews that opt in with
 * ENABLE_PROTOTYPE, and returns 404 anywhere else.
 *
 * 404 rather than a redirect or an error: on a production deployment this route
 * genuinely does not exist, and saying so leaks nothing about the internals.
 */
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
}

export default function DesignLayout({ children }: { children: ReactNode }) {
  if (!prototypeRoutesEnabled()) notFound()

  return <>{children}</>
}
