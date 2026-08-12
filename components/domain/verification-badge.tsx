import { BadgeCheck, ShieldQuestion } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { verificationLabel, verificationTone } from "@/lib/domain/membership"
import type { VerificationState } from "@/lib/domain/types"

/**
 * Verification status for a community or organiser.
 *
 * Shared between communities and events rather than owned by either, because
 * an event card shows its host community's verification too. Unverified renders
 * nothing at all: an "Unverified" pill on every young community reads as an
 * accusation, and absence of a claim is the honest default. The label always
 * accompanies the icon so the meaning survives greyscale and colour-blindness.
 */
export function VerificationBadge({
  state,
  compact = false,
}: {
  state: VerificationState
  /** Icon-only, with the label moved to assistive text. */
  compact?: boolean
}) {
  if (state === "UNVERIFIED") return null

  const Icon = state === "VERIFIED" ? BadgeCheck : ShieldQuestion
  const label = verificationLabel[state]

  return (
    <Badge variant={verificationTone[state]} title={label}>
      <Icon aria-hidden="true" />
      {compact ? <span className="sr-only">{label}</span> : label}
    </Badge>
  )
}
