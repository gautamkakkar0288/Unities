import type { ConversationScope } from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

/**
 * Conversation scopes.
 *
 * Messaging on a campus platform is scoped rather than open (PRD section 6).
 * Unrestricted DMs between thousands of students who share a physical campus is
 * a harassment vector with a directory attached, so a conversation must be
 * justified by a shared context: an official channel, a community you belong to,
 * an event you registered for, or a mutual community for direct messages.
 *
 * Encoding the scope on the conversation itself means a permission check never
 * has to reconstruct why two people are allowed to talk.
 */

export const conversationScopeLabel: Record<ConversationScope, string> = {
  OFFICIAL: "Official",
  COMMUNITY: "Community",
  EVENT: "Event",
  DIRECT: "Direct",
}

export const conversationScopeTone: Record<ConversationScope, Tone> = {
  OFFICIAL: "info",
  COMMUNITY: "brand",
  EVENT: "support",
  DIRECT: "neutral",
}

/** Whether the viewer can reply, or the channel is broadcast-only. */
export function canReply(scope: ConversationScope): boolean {
  return scope !== "OFFICIAL"
}

/**
 * Event channels close after the event so they do not become orphaned group
 * chats nobody moderates.
 */
export const EVENT_CHANNEL_CLOSES_AFTER_HOURS = 48
