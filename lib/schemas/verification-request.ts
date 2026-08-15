import { z } from "zod"

import { userRoles } from "@/lib/db/schema"
import {
  MAXIMUM_EVIDENCE_LENGTH,
  MINIMUM_EVIDENCE_LENGTH,
} from "@/lib/domain/organizer-verification"

/**
 * Input shapes for organiser verification and role assignment.
 *
 * The evidence bounds are imported from the domain rather than written as
 * literals here, so the form, the schema, and the service cannot drift into
 * three different opinions about what "enough" means.
 *
 * Note what is deliberately absent: any notion of who may do these things.
 * Zod validates shape, and shape is all it can validate - it runs in the
 * browser too, where it cannot see a role. Authorization lives in the services.
 */

export const requestVerificationSchema = z.object({
  communitySlug: z.string().trim().min(1, "Choose a community."),
  evidence: z
    .string()
    .trim()
    .min(
      MINIMUM_EVIDENCE_LENGTH,
      `Tell us a little more - at least ${MINIMUM_EVIDENCE_LENGTH} characters. ` +
        "A registration number, a faculty contact, or a link all help.",
    )
    .max(
      MAXIMUM_EVIDENCE_LENGTH,
      `Please keep this under ${MAXIMUM_EVIDENCE_LENGTH} characters.`,
    ),
})

export type RequestVerificationInput = z.infer<typeof requestVerificationSchema>

/**
 * `PENDING` is not an option. A review is a decision, and "decide this is
 * still undecided" is not one - allowing it would let a reviewer write a note
 * and a decided-at timestamp onto a request that is still open.
 */
export const reviewVerificationSchema = z.object({
  requestId: z.string().trim().min(1, "Which request?"),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z
    .string()
    .trim()
    .max(500, "Please keep the note under 500 characters.")
    .optional(),
})

export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>

export const assignRoleSchema = z.object({
  userId: z.string().trim().min(1, "Which person?"),
  role: z.enum(userRoles),
})

export type AssignRoleInput = z.infer<typeof assignRoleSchema>
