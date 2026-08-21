import type { NextResponse } from "next/server"

import { logRouteFault } from "./errors"
import { mobileError } from "./response"

/**
 * The last line of defence for a route handler.
 *
 * The service layer returns expected failures as values, so anything that
 * actually throws in here is a fault: a dropped connection, a constraint that
 * should have been impossible, a bug. Those must not reach the client as a
 * stack trace or a Postgres message - Next would happily serialise either - so
 * they are logged server-side and answered with one generic sentence.
 */
export function withMobileRoute<TArgs extends unknown[]>(
  route: string,
  handler: (...args: TArgs) => Promise<NextResponse>,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args)
    } catch (error) {
      logRouteFault(route, error)

      return mobileError(
        "INTERNAL_ERROR",
        "Something went wrong on our end. Try again shortly.",
      )
    }
  }
}
