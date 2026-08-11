import { z } from "zod"

import { MINIMUM_INTERESTS } from "@/lib/domain/interest"

/**
 * Input contracts for community and interest writes.
 *
 * Every service parses its input with one of these before touching the
 * database, even when a typed form already validated it - a server action is a
 * public HTTP endpoint, and the form is only the polite caller.
 */

export const proposeCommunitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Give the community a name of at least 3 characters.")
    .max(60, "Keep the name under 60 characters."),
  tagline: z
    .string()
    .trim()
    .min(10, "One line on what this community is for.")
    .max(120, "Keep the tagline under 120 characters."),
  /**
   * Required, and deliberately not optional. "Why should this exist?" is the
   * question that separates a considered proposal from a passing thought, and
   * it is the only thing a reviewer actually has to go on.
   */
  reason: z
    .string()
    .trim()
    .min(30, "Tell the reviewer why this needs to exist. A sentence or two.")
    .max(600, "Keep it under 600 characters."),
  interestId: z.string().min(1, "Pick an interest."),
  scope: z.enum(["UNIVERSITY", "CITY", "INTEREST", "GLOBAL"]),
  placeId: z.string().min(1).nullable(),
  /**
   * Set once the student has seen the duplicate warning and still wants to
   * proceed. The first submission never carries it, so the warning cannot be
   * skipped by a client that forgets to render it.
   */
  acknowledgedDuplicates: z.boolean().default(false),
})

export type ProposeCommunityInput = z.infer<typeof proposeCommunitySchema>

export const suggestInterestSchema = z.object({
  label: z
    .string()
    .trim()
    .min(3, "Give the interest a name of at least 3 characters.")
    .max(40, "Interest names should be short - one or two words."),
})

export type SuggestInterestInput = z.infer<typeof suggestInterestSchema>

export const setInterestsSchema = z.object({
  interestIds: z
    .array(z.string().min(1))
    .min(
      MINIMUM_INTERESTS,
      `Pick at least ${MINIMUM_INTERESTS} interests so we can show you things worth turning up to.`,
    )
    .max(17, "That is all of them - pick the ones you actually care about."),
})

export type SetInterestsInput = z.infer<typeof setInterestsSchema>
