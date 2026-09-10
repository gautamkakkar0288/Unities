import type { ServiceErrorCode, ServiceFailure } from "@/lib/services/result"

/**
 * The error vocabulary the mobile client is allowed to see.
 *
 * These codes are a contract, not a convenience. The Flutter client switches on
 * them to decide whether to retry, to sign the student out, or to mark a form
 * field - so they are stable strings rather than HTTP statuses alone, and the
 * message beside each one is written for a student. Nothing here ever carries a
 * SQL fragment, a stack, or an internal identifier.
 *
 * `MISSING_BACKEND_CAPABILITY` is deliberately part of the vocabulary rather
 * than being flattened into a 404. Cirqles has product surfaces the web app has
 * not built yet - the feed being the obvious one - and the mobile client already
 * models that state explicitly. A 404 would tell the client the route is wrong
 * and to stop asking; a capability gap tells it the truth, which is that the
 * screen is waiting on the backend.
 */
export const mobileErrorCodes = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "CONFLICT",
  "BAD_REQUEST",
  "MISSING_BACKEND_CAPABILITY",
  "INTERNAL_ERROR",
] as const

export type MobileErrorCode = (typeof mobileErrorCodes)[number]

export const mobileErrorStatus: Record<MobileErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  CONFLICT: 409,
  BAD_REQUEST: 400,
  MISSING_BACKEND_CAPABILITY: 501,
  INTERNAL_ERROR: 500,
}

/**
 * Service failures already carry a code and a message written for the student,
 * so this is a translation rather than a decision. That matters: if a route
 * reworded a refusal, the mobile client and the web UI would start explaining
 * the same rule differently.
 *
 * `INVALID` becomes `VALIDATION_ERROR` because the service layer's word for
 * "your input was refused" is this layer's 422.
 */
const serviceCodes: Record<ServiceErrorCode, MobileErrorCode> = {
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  INVALID: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
}

export function mobileCodeForFailure(failure: ServiceFailure): MobileErrorCode {
  return serviceCodes[failure.code]
}

/**
 * Server-side detail goes to the server log and nowhere else, matching the
 * existing convention in `features/auth/actions.ts`. The client gets a generic
 * message; whoever is on call gets the cause.
 */
export function logRouteFault(route: string, error: unknown): void {
  console.error(`[mobile-api] ${route} failed`, error)
}
