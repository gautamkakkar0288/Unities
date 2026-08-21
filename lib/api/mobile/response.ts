import { NextResponse } from "next/server"

import type { ServiceFailure } from "@/lib/services/result"

import {
  mobileCodeForFailure,
  mobileErrorStatus,
  type MobileErrorCode,
} from "./errors"

/**
 * One envelope for every mobile response.
 *
 * `{ data }` and `{ error }` are mutually exclusive on purpose: a client that
 * has to check both a status code and a nullable field to find out whether a
 * request worked will eventually check only one of them. Lists always carry
 * `meta`, so paging code never has to special-case the first page.
 */

export type MobileMeta = Record<string, unknown>

export function mobileData<T>(
  data: T,
  meta?: MobileMeta,
  status = 200,
): NextResponse {
  return NextResponse.json(meta ? { data, meta } : { data }, { status })
}

export type MobilePageMeta = {
  /**
   * Pass back as `?cursor=`. Null means there is no next page to ask for -
   * either because this is the end, or because the underlying service does not
   * support a cursor yet. `hasMore` distinguishes the two.
   */
  nextCursor: string | null
  hasMore: boolean
  limit: number
}

export function mobileList<T>(
  items: T[],
  meta: MobilePageMeta,
): NextResponse {
  return NextResponse.json({ data: items, meta })
}

export function mobileError(
  code: MobileErrorCode,
  message: string,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status: mobileErrorStatus[code] },
  )
}

/**
 * A service refusal, passed through without rewording. The service layer wrote
 * that sentence for a student and it is already the sentence the web UI shows.
 */
export function mobileFailure(failure: ServiceFailure): NextResponse {
  return mobileError(mobileCodeForFailure(failure), failure.message)
}

export function mobileMissingCapability(message: string): NextResponse {
  return mobileError("MISSING_BACKEND_CAPABILITY", message)
}
