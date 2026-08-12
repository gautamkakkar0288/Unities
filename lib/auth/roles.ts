import type { UserRole } from "@/lib/db/schema"

/**
 * Human-readable role names and the badge treatment each one gets.
 *
 * Trust is a product feature (PRD section 3), so a user's role is shown rather
 * than implied. Centralised here so a role never renders as a raw enum like
 * COMMUNITY_MODERATOR in the UI.
 */
export const roleLabels: Record<UserRole, string> = {
  STUDENT: "Student",
  ORGANIZER: "Organiser",
  COMMUNITY_MODERATOR: "Moderator",
  UNIVERSITY_ADMIN: "University admin",
  PLATFORM_ADMIN: "Platform admin",
}

export const roleBadgeVariant: Record<
  UserRole,
  "neutral" | "brand" | "support" | "info" | "featured"
> = {
  STUDENT: "neutral",
  ORGANIZER: "brand",
  COMMUNITY_MODERATOR: "support",
  UNIVERSITY_ADMIN: "info",
  PLATFORM_ADMIN: "featured",
}
