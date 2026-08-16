import { userRoles, type UserRole } from "@/lib/db/schema"

/**
 * What each role may do, as pure functions over the role alone.
 *
 * Separate from lib/auth/roles.ts, which is presentation: labels and badge
 * variants. That file answers "what does this role look like", this one answers
 * "what may this role do", and mixing them is how a permission check ends up
 * living next to a colour.
 *
 * No I/O here on purpose. Authorization decisions are the things most worth
 * testing exhaustively, and a pure predicate can be tested exhaustively in
 * milliseconds - which is why every rule below is a function rather than an
 * `if` inside a service.
 */

/**
 * Roles are ordered. The order is what makes "at or above your own level" a
 * comparison rather than a table of special cases that grows every time a role
 * is added.
 */
const ROLE_RANK: Record<UserRole, number> = {
  STUDENT: 0,
  ORGANIZER: 1,
  COMMUNITY_MODERATOR: 2,
  UNIVERSITY_ADMIN: 3,
  PLATFORM_ADMIN: 4,
}

export function roleRank(role: UserRole): number {
  return ROLE_RANK[role]
}

/** Campus-wide or platform-wide authority, as opposed to one community. */
export function isAdminRole(role: UserRole): boolean {
  return role === "UNIVERSITY_ADMIN" || role === "PLATFORM_ADMIN"
}

/**
 * Who may decide whether a club is real.
 *
 * Not `COMMUNITY_MODERATOR`: moderating one community is authority over its
 * posts and members, not the authority to grant campus-wide recognition to
 * another club. Conflating the two would let any moderator verify themselves.
 */
export function canReviewVerification(role: UserRole): boolean {
  return isAdminRole(role)
}

/** Who may change anyone's role at all. */
export function canAssignRoles(role: UserRole): boolean {
  return isAdminRole(role)
}

/**
 * The roles this actor may hand out: strictly below their own.
 *
 * A platform admin therefore cannot create another platform admin. That is
 * deliberate, not an oversight - the only way to mint one is a database
 * operation or the seed, so compromising a single admin account does not
 * quietly produce a second permanent one.
 */
export function assignableRoles(actor: UserRole): UserRole[] {
  if (!canAssignRoles(actor)) return []
  return userRoles.filter((role) => roleRank(role) < roleRank(actor))
}

/**
 * Why a role change was refused, or `null` if it is allowed.
 *
 * Returning a reason rather than a boolean so the service can say which rule
 * was hit. "You cannot do that" teaches an admin nothing about what they can
 * do, and the reasons here are the ones people actually run into.
 */
export type RoleAssignmentRefusal =
  | "NOT_PERMITTED"
  | "SELF"
  | "ABOVE_ACTOR"
  | "TARGET_ABOVE_ACTOR"
  | "UNCHANGED"

export function refuseRoleAssignment(args: {
  actorId: string
  actorRole: UserRole
  targetId: string
  targetRole: UserRole
  nextRole: UserRole
}): RoleAssignmentRefusal | null {
  if (!canAssignRoles(args.actorRole)) return "NOT_PERMITTED"

  /**
   * Checked before anything else, and applied even to a platform admin. Self
   * promotion is the attack this whole module exists to prevent, and "an admin
   * would not do that" stops being true the moment an admin session is stolen.
   */
  if (args.actorId === args.targetId) return "SELF"

  if (roleRank(args.nextRole) >= roleRank(args.actorRole)) return "ABOVE_ACTOR"

  /** No acting on peers or superiors, so admins cannot demote each other. */
  if (roleRank(args.targetRole) >= roleRank(args.actorRole)) {
    return "TARGET_ABOVE_ACTOR"
  }

  if (args.nextRole === args.targetRole) return "UNCHANGED"

  return null
}
