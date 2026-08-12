import type { UserRole } from "@/lib/db/schema"
import type {
  CommunityKind,
  CommunityRef,
  CommunityScope,
  CommunitySummary,
  JoinPolicy,
} from "@/lib/domain/types"
import type { Tone } from "@/lib/ui/tone"

/**
 * Community vocabulary, creation rights, and duplicate detection.
 *
 * The interesting part of this file is `findSimilarCommunities`. A platform that
 * lets students name things accumulates "Chitkara Football", "Football
 * Chitkara", and "Chitkara Football Lovers" within a week, and once they exist,
 * discovery and recommendations are permanently split three ways. Approval
 * review alone does not fix this - a human reviewer sees one proposal at a time
 * and cannot remember every existing name. Detection has to happen at the
 * moment of typing, before the student has invested effort in the idea.
 */

export const communityKindLabel: Record<CommunityKind, string> = {
  OFFICIAL: "Official",
  INTEREST: "Interest",
  STUDENT: "Student-run",
}

export const communityKindTone: Record<CommunityKind, Tone> = {
  OFFICIAL: "info",
  INTEREST: "support",
  STUDENT: "neutral",
}

export const communityKindDescription: Record<CommunityKind, string> = {
  OFFICIAL:
    "Run by the university, a registered club, or a verified organiser.",
  INTEREST: "Seeded from the interest taxonomy. Open to everyone, owned by nobody.",
  STUDENT: "Proposed by a student and approved by review.",
}

export const communityScopeLabel: Record<CommunityScope, string> = {
  UNIVERSITY: "My university",
  CITY: "My city",
  INTEREST: "My interests",
  GLOBAL: "Everywhere",
}

/**
 * Discovery order: campus, then city, then interest, then the wider network.
 * A student's own campus is the most likely place they will actually turn up to
 * something, so it is never below a generic global community.
 */
export const communityScopeOrder: CommunityScope[] = [
  "UNIVERSITY",
  "CITY",
  "INTEREST",
  "GLOBAL",
]

export const joinPolicyLabel: Record<JoinPolicy, string> = {
  OPEN: "Open to all",
  APPROVAL: "Approval needed",
  INVITE: "Invite only",
}

export const joinPolicyDescription: Record<JoinPolicy, string> = {
  OPEN: "Anyone eligible joins immediately.",
  APPROVAL: "A moderator reviews each request.",
  INVITE: "Members are added by invitation only.",
}

/** The default for a new community. Friction kills community growth. */
export const DEFAULT_JOIN_POLICY: JoinPolicy = "OPEN"

/** The default scope. A community belongs to a campus until told otherwise. */
export const DEFAULT_SCOPE: CommunityScope = "UNIVERSITY"

/**
 * Who may create a community outright, without review.
 *
 * Students propose; staff and verified organisers create. Interest communities
 * are seeded by platform admins so they have no owner and cannot be captured by
 * whoever registered the name first.
 */
export function canCreateCommunityDirectly(role: UserRole): boolean {
  return (
    role === "PLATFORM_ADMIN" ||
    role === "UNIVERSITY_ADMIN" ||
    role === "ORGANIZER"
  )
}

export function canProposeCommunity(role: UserRole): boolean {
  return !canCreateCommunityDirectly(role)
}

/** Which kinds a given role is allowed to bring into existence. */
export function creatableKinds(role: UserRole): CommunityKind[] {
  if (role === "PLATFORM_ADMIN") return ["OFFICIAL", "INTEREST", "STUDENT"]
  if (role === "UNIVERSITY_ADMIN") return ["OFFICIAL", "STUDENT"]
  if (role === "ORGANIZER") return ["OFFICIAL"]
  return []
}

/**
 * Only official communities can carry the verified badge.
 *
 * Verification claims institutional backing. A student-run community can be
 * excellent and still have nothing to verify, and letting it apply would make
 * the badge mean "popular" rather than "accountable".
 */
export function canRequestVerification(kind: CommunityKind): boolean {
  return kind === "OFFICIAL"
}

/**
 * Drop a trailing plural `s` so "Trekkers" and "Trekker" collide.
 *
 * Words ending in a double s are left alone: "Chess" is not the plural of
 * "Ches", and mangling it would split a real community from itself.
 */
function singularise(word: string): string {
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word
}

/**
 * Words that carry no distinguishing information in a campus community name.
 *
 * "Chitkara" is a stopword here on purpose: inside a university-scoped
 * community, naming the university adds nothing, so "Chitkara Football" and
 * "Football" are the same request.
 *
 * The list is written in the form students actually type it and then
 * singularised to match, because `nameTokens` singularises before filtering.
 * Comparing raw "lovers" against an already-singularised "lover" silently let
 * "Chitkara Football Lovers" survive as a distinct name.
 */
const NOISE_WORDS = new Set(
  [
    "the",
    "a",
    "an",
    "of",
    "and",
    "for",
    "at",
    "in",
    "chitkara",
    "university",
    "college",
    "campus",
    "official",
    "club",
    "clubs",
    "society",
    "cell",
    "group",
    "groups",
    "community",
    "team",
    "teams",
    "lovers",
    "fans",
    "enthusiasts",
    "squad",
    "crew",
  ].map(singularise),
)

/**
 * Reduce a community name to the words that actually identify it.
 *
 * Lowercased, punctuation stripped, singularised, then noise words removed.
 * Deliberately crude: this is a duplicate *warning*, and a false positive costs
 * a student one glance while a false negative costs the platform a permanently
 * split community.
 */
export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(singularise)
    .filter((word) => !NOISE_WORDS.has(word))
}

/** Stable comparison key. Two names with the same key are the same request. */
export function normaliseCommunityName(name: string): string {
  return [...new Set(nameTokens(name))].sort().join(" ")
}

/**
 * Jaccard overlap of the identifying words, 0 to 1.
 *
 * Chosen over edit distance because word order is the common failure here
 * ("Football Chitkara" vs "Chitkara Football"), and Levenshtein rates those as
 * wildly different while set overlap correctly calls them identical.
 */
export function nameSimilarity(a: string, b: string): number {
  const left = new Set(nameTokens(a))
  const right = new Set(nameTokens(b))
  if (left.size === 0 || right.size === 0) return 0

  let shared = 0
  for (const token of left) if (right.has(token)) shared += 1

  const union = left.size + right.size - shared
  return union === 0 ? 0 : shared / union
}

/** Above this, the proposal screen warns before the student can submit. */
export const DUPLICATE_THRESHOLD = 0.5

export function findSimilarCommunities(
  proposedName: string,
  existing: CommunitySummary[],
): Array<{ community: CommunitySummary; similarity: number }> {
  return existing
    .map((community) => ({
      community,
      similarity: nameSimilarity(proposedName, community.name),
    }))
    .filter((match) => match.similarity >= DUPLICATE_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
}

export function toCommunityRef(community: CommunitySummary): CommunityRef {
  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    verification: community.verification,
  }
}

/** Group communities for the directory, campus first, empty scopes dropped. */
export function groupByScope(
  communities: CommunitySummary[],
): Array<{ scope: CommunityScope; communities: CommunitySummary[] }> {
  return communityScopeOrder
    .map((scope) => ({
      scope,
      communities: communities.filter((community) => community.scope === scope),
    }))
    .filter((group) => group.communities.length > 0)
}
