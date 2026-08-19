import { canModerate, canParticipate } from "@/lib/domain/membership"
import type { MembershipState } from "@/lib/domain/types"

/**
 * The rules of community activity, as pure functions.
 *
 * These live here rather than inside the services and components that use them
 * for one reason: a hidden button is not authorization, and a service check
 * that disagrees with the button is worse than either. The composer decides
 * whether to render from `canPublish`, and the service decides whether to
 * refuse from `canPublish`. There is one rule, so they cannot diverge.
 *
 * Nothing here touches the database, the clock, or React. Every rule below is
 * testable against literals, which is the point - authorization logic that can
 * only be exercised through a request is authorization logic nobody tests.
 */

/**
 * Length limits.
 *
 * A title is a headline, not a paragraph: 120 characters is about two lines on
 * a 390px card, and the limit exists so a post cannot push the actions off the
 * bottom of a phone screen. The body limit is generous because an announcement
 * legitimately carries detail - schedules, eligibility, what to bring - and
 * truncating that would push clubs back to posting screenshots.
 *
 * Comments are capped well below posts on purpose. A comment field that accepts
 * four thousand characters is an invitation to hold a debate in a reply, which
 * is the thing flat comments cannot host well.
 */
export const POST_TITLE_MAX = 120
export const POST_BODY_MAX = 4000
export const COMMENT_BODY_MAX = 600

/** A page of comments. Bounded because Home renders many posts at once. */
export const COMMENT_PAGE_LIMIT = 20

/** Announcements shown on a community page before "see more" would be needed. */
export const COMMUNITY_ACTIVITY_LIMIT = 20

export type ActivityFieldError = {
  field: "title" | "body"
  message: string
}

/**
 * Normalises whitespace without touching the inside of the text.
 *
 * Trims the ends and strips a trailing run of blank lines, because a body
 * pasted from a document usually arrives with both. Interior newlines survive:
 * an announcement with a list in it should keep the list.
 */
export function normaliseBody(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\s+$/u, "").replace(/^\s+/u, "")
}

/** Titles are single-line, so interior whitespace collapses. */
export function normaliseTitle(value: string): string {
  return value.replace(/\s+/gu, " ").trim()
}

/**
 * Validates a post the way the form and the service both need it validated.
 *
 * Returns every problem rather than the first, so a student fixing a form is
 * not told about one field at a time.
 *
 * An empty body is allowed. "Tryouts are cancelled" is a complete announcement,
 * and forcing a paragraph after it would produce padding, not information. An
 * empty *title* is not allowed, because the title is what every card, feed row
 * and search result renders.
 */
export function validatePostInput(input: {
  title: string
  body: string
}): ActivityFieldError[] {
  const errors: ActivityFieldError[] = []
  const title = normaliseTitle(input.title)
  const body = normaliseBody(input.body)

  if (title.length === 0) {
    errors.push({ field: "title", message: "Give your update a title." })
  } else if (title.length > POST_TITLE_MAX) {
    errors.push({
      field: "title",
      message: `Titles are at most ${POST_TITLE_MAX} characters.`,
    })
  }

  if (body.length > POST_BODY_MAX) {
    errors.push({
      field: "body",
      message: `Updates are at most ${POST_BODY_MAX} characters.`,
    })
  }

  return errors
}

/**
 * Validates a comment.
 *
 * Unlike a post body, empty is refused: a comment with no text is not a
 * shorter contribution, it is a misclick.
 */
export function validateCommentInput(input: { body: string }): ActivityFieldError[] {
  const body = normaliseBody(input.body)

  if (body.length === 0) {
    return [{ field: "body", message: "Write something first." }]
  }

  if (body.length > COMMENT_BODY_MAX) {
    return [
      {
        field: "body",
        message: `Comments are at most ${COMMENT_BODY_MAX} characters.`,
      },
    ]
  }

  return []
}

/**
 * Who may publish an announcement.
 *
 * Reuses `canParticipate` rather than defining a second answer to "is this
 * person in this community". Pending and invited states are excluded by it,
 * which is the behaviour wanted here too: someone whose join request is still
 * waiting cannot announce things to a community that has not accepted them.
 *
 * Note this is membership, not `users.role`. A campus admin is not thereby a
 * member of every club, and should not be able to speak in a club's name.
 */
export function canPublish(state: MembershipState): boolean {
  return canParticipate(state)
}

/** Who may comment. The same rule as publishing, deliberately. */
export function canComment(state: MembershipState): boolean {
  return canParticipate(state)
}

/**
 * Who may react.
 *
 * Also membership. A like is a signal from inside the community about whether
 * an announcement landed, and it is worth less than nothing if anyone passing
 * the page can inflate it.
 */
export function canReact(state: MembershipState): boolean {
  return canParticipate(state)
}

/**
 * Who may edit a post: its author, and nobody else.
 *
 * Explicitly *not* moderators. A moderator editing someone's words while they
 * still carry that person's name is the one moderation action with no honest
 * presentation - the reader cannot tell what was said from what was changed.
 * Moderators remove, which is visible, attributable and reversible.
 */
export function canEditPost(args: {
  authorId: string | null
  viewerId: string
  removed: boolean
}): boolean {
  if (args.removed) return false
  return args.authorId !== null && args.authorId === args.viewerId
}

/**
 * Who may take a post down: its author, or a moderator of that community.
 *
 * Both routes end in the same `removedAt`, but `removedById` records which
 * happened, so "the author withdrew this" is never confused with "a moderator
 * removed this".
 */
export function canRemovePost(args: {
  authorId: string | null
  viewerId: string
  viewerState: MembershipState
  removed: boolean
}): boolean {
  if (args.removed) return false
  if (args.authorId !== null && args.authorId === args.viewerId) return true
  return canModerate(args.viewerState)
}

/** Who may edit a comment: its author only, same reasoning as a post. */
export function canEditComment(args: {
  authorId: string | null
  viewerId: string
  removed: boolean
}): boolean {
  if (args.removed) return false
  return args.authorId !== null && args.authorId === args.viewerId
}

/** Who may remove a comment: its author, or a moderator of the community. */
export function canRemoveComment(args: {
  authorId: string | null
  viewerId: string
  viewerState: MembershipState
  removed: boolean
}): boolean {
  if (args.removed) return false
  if (args.authorId !== null && args.authorId === args.viewerId) return true
  return canModerate(args.viewerState)
}

/**
 * Who may report something: any signed-in student who did not write it.
 *
 * Reporting your own post is not dangerous, just meaningless - it occupies a
 * moderator's queue with a complaint the author could resolve by pressing
 * delete.
 */
export function canReport(args: {
  authorId: string | null
  viewerId: string
}): boolean {
  return args.authorId !== args.viewerId
}

/**
 * Whether a moderation decision is available on this report.
 *
 * A report already resolved or dismissed is closed. Reopening it would
 * overwrite the first decision and the note explaining it, and the audit log
 * would then show two conflicting entries with no way to tell which stood.
 */
export function canDecideReport(status: string): boolean {
  return status === "OPEN" || status === "IN_REVIEW"
}

/**
 * The word for a reaction, in one place.
 *
 * "Like" rather than an invented campus verb, because the control has to be
 * understood instantly and unfamiliar wording on a button is friction with no
 * upside.
 */
export const reactionLabel = "Like"
export const reactedLabel = "Liked"

/**
 * How the reaction control describes itself to assistive technology.
 *
 * A heart that changes colour communicates nothing to a screen reader, and
 * `aria-pressed` alone leaves the count unspoken. This says both.
 */
export function describeReaction(args: {
  reacted: boolean
  count: number
  title: string
}): string {
  const people = args.count === 1 ? "1 person" : `${args.count} people`
  return args.reacted
    ? `You and ${args.count - 1 === 1 ? "1 other" : `${args.count - 1} others`} liked ${args.title}. Press to remove your like.`
    : `${people} liked ${args.title}. Press to like.`
}

/**
 * A short preview of a body, cut on a word boundary.
 *
 * Cutting mid-word produces "regist" and reads as a rendering bug rather than
 * an excerpt.
 */
export function excerptOf(body: string, limit = 220): string {
  const flat = body.replace(/\s+/gu, " ").trim()
  if (flat.length <= limit) return flat

  const cut = flat.slice(0, limit)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}\u2026`
}
