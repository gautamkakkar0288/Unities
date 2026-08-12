"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  joinCommunityAction,
  leaveCommunityAction,
} from "@/features/communities/actions"
import {
  describeLeaveAction,
  describeMembershipAction,
  membershipIntent,
} from "@/lib/domain/membership"
import type { CommunitySummary } from "@/lib/domain/types"

/**
 * The join control.
 *
 * What it says and what it does both come from the domain layer, so the two
 * cannot drift apart. The component's own job is the part that genuinely needs
 * a browser: pending state, and putting a refusal somewhere a student can read
 * it.
 *
 * There is no optimistic update. Three of the possible outcomes are not
 * "joined" - an approval community returns PENDING, an invite-only one refuses,
 * and the sole owner of a community is blocked from leaving - so flipping the
 * label first would be wrong more often than it would be right, and being
 * briefly told you are a member when you are not is worse than waiting.
 */
export function JoinButton({
  community,
  size = "lg",
}: {
  community: Pick<
    CommunitySummary,
    "id" | "slug" | "name" | "joinPolicy" | "viewerMembership"
  >
  size?: "sm" | "lg"
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const intent = membershipIntent(community)
  const joinLabel = describeMembershipAction(community)
  const leaveLabel = describeLeaveAction(community)

  // Nothing to press: invite-only, and this viewer has no invitation.
  if (intent === "NONE") {
    return (
      <Button
        type="button"
        variant={joinLabel.variant}
        size={size}
        disabled
        aria-label={joinLabel.accessibleLabel}
      >
        {joinLabel.label}
      </Button>
    )
  }

  const label = intent === "JOIN" ? joinLabel.label : leaveLabel.label
  const accessibleLabel =
    intent === "JOIN" ? joinLabel.accessibleLabel : leaveLabel.accessibleLabel

  function run() {
    setError(null)

    startTransition(async () => {
      const target = { communityId: community.id, slug: community.slug }

      const failure =
        intent === "JOIN"
          ? await joinCommunityAction(target)
          : await leaveCommunityAction(target)

      // Success returns nothing: the server action revalidates and this
      // component is re-rendered from the database with the new state.
      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={intent === "JOIN" ? joinLabel.variant : "outline"}
        size={size}
        onClick={run}
        disabled={pending}
        aria-busy={pending}
        aria-label={accessibleLabel}
      >
        {label}
      </Button>

      {/*
        The refusals here are written for students - "This community is invite
        only", "You are the only owner" - and are the whole reason the service
        returns messages rather than codes. Losing them to a console would make
        the button look broken.
      */}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
