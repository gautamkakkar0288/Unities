import type { ConversationScope } from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

/**
 * Messaging is scoped, not open (PRD section 6).
 *
 * Students can reach each other through something they already share - an
 * event, a community, an activity - rather than through an open inbox. That is
 * a safety decision as much as a product one: an open DM system on a campus
 * platform is a harassment surface with a messaging feature attached.
 */

export const conversationScopeLabel: Record<ConversationScope, string> = {
  OFFICIAL: "Official",
  COMMUNITY: "Community",
  EVENT: "Event",
  ACTIVITY: "Activity",
  DIRECT: "Direct",
}

export const conversationScopeTone: Record<ConversationScope, Tone> = {
  OFFICIAL: "info",
  COMMUNITY: "brand",
  EVENT: "support",
  ACTIVITY: "success",
  DIRECT: "neutral",
}

/** Official channels are broadcasts. Everything else is a conversation. */
export function canReply(scope: ConversationScope): boolean {
  return scope !== "OFFICIAL"
}

/**
 * Event channels close after the event, and activity channels close when the
 * activity expires. A channel that outlives its reason for existing becomes a
 * group chat nobody can leave.
 */
export const EVENT_CHANNEL_CLOSES_AFTER_HOURS = 48
