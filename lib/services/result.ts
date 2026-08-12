/**
 * Service results are values, not exceptions.
 *
 * Every failure below is an expected outcome - an invite-only community, a
 * duplicate proposal, a moderator acting on a community they do not moderate.
 * Throwing for those means the caller either wraps every call in try/catch or
 * ships a 500 to a student who did nothing wrong, and TypeScript cannot tell
 * you which functions throw what. A discriminated union makes the failure modes
 * part of the signature, so a caller that forgets to handle one does not
 * compile.
 *
 * Exceptions remain for genuine faults: a dropped connection, a constraint that
 * should have been impossible. Those are bugs and should reach the error
 * boundary loudly.
 */

export type ServiceErrorCode =
  /** The thing being acted on does not exist, or is not visible to this user. */
  | "NOT_FOUND"
  /** The user exists and the thing exists, but this is not allowed. */
  | "FORBIDDEN"
  /** The input failed validation before anything was attempted. */
  | "INVALID"
  /** The action conflicts with current state, e.g. the last owner leaving. */
  | "CONFLICT"

export type ServiceFailure = {
  ok: false
  code: ServiceErrorCode
  /** Written for the student, not the log. This string reaches the UI. */
  message: string
}

export type ServiceResult<T> = { ok: true; data: T } | ServiceFailure

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data }
}

export function fail(code: ServiceErrorCode, message: string): ServiceFailure {
  return { ok: false, code, message }
}
