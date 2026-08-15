import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  auditLog,
  users,
  type AuditTargetKind,
  type UserRole,
} from "@/lib/db/schema"
import { AUDIT_ACTIONS } from "@/lib/domain/audit"
import {
  refuseRoleAssignment,
  type RoleAssignmentRefusal,
} from "@/lib/domain/role"
import { assignRoleSchema } from "@/lib/schemas/verification-request"
import { fail, ok, type ServiceResult } from "@/lib/services/result"

/**
 * Role assignment (Phase 2.4).
 *
 * The rules are in `lib/domain/role.ts` as one pure predicate, and this file
 * does the I/O around it. That split is the point: the question "may this
 * person grant that role" is answered by a function with no database, which can
 * be tested against every combination of roles in milliseconds, and there is
 * exactly one such function so the answer cannot vary by call site.
 *
 * This is the only place `users.role` is written outside of verification
 * approval. If a second one ever appears, the self-promotion guard has to be
 * remembered twice.
 */

/** Each refusal, in words an admin can act on. */
const REFUSAL_MESSAGES: Record<RoleAssignmentRefusal, string> = {
  NOT_PERMITTED: "You cannot change roles.",
  SELF: "You cannot change your own role. Ask another admin.",
  ABOVE_ACTOR: "You cannot grant a role at or above your own.",
  TARGET_ABOVE_ACTOR:
    "You cannot change the role of someone at or above your own level.",
  UNCHANGED: "They already have that role.",
}

export async function assignRole(args: {
  actorId: string
  input: unknown
}): Promise<ServiceResult<{ role: UserRole }>> {
  const parsed = assignRoleSchema.safeParse(args.input)
  if (!parsed.success) {
    return fail(
      "INVALID",
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    )
  }

  const { userId: targetUserId, role: nextRole } = parsed.data

  const [actor] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, args.actorId))
    .limit(1)

  if (!actor) {
    return fail("FORBIDDEN", REFUSAL_MESSAGES.NOT_PERMITTED)
  }

  const [target] = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)

  if (!target) {
    return fail("NOT_FOUND", "That person does not exist.")
  }

  const refusal = refuseRoleAssignment({
    actorId: actor.id,
    actorRole: actor.role,
    targetId: target.id,
    targetRole: target.role,
    nextRole,
  })

  if (refusal) {
    // UNCHANGED is a bad request, not a permission problem; the rest are.
    const code = refusal === "UNCHANGED" ? "INVALID" : "FORBIDDEN"
    return fail(code, REFUSAL_MESSAGES[refusal])
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ role: nextRole })
      .where(eq(users.id, target.id))

    await tx.insert(auditLog).values({
      actorId: actor.id,
      action: AUDIT_ACTIONS.roleAssigned,
      targetKind: "USER" satisfies AuditTargetKind,
      targetId: target.id,
      summary: `Changed ${target.name ?? target.id} from ${target.role} to ${nextRole}`,
    })
  })

  return ok({ role: nextRole })
}
