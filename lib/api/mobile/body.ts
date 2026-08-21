import type { NextResponse } from "next/server"

import { mobileError } from "./response"

/**
 * Request body handling for the mobile API.
 *
 * `request.json()` throws on an empty or malformed body, and an unhandled throw
 * in a route handler becomes a 500 - which would report a client's typo as a
 * server fault. These read the text first and answer with a 400 instead.
 */

export type BodyResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: NextResponse }

const INVALID_JSON = "That request body is not valid JSON."

export async function readOptionalJson(
  request: Request,
): Promise<BodyResult<unknown>> {
  const raw = await request.text()

  if (raw.trim().length === 0) return { ok: true, value: null }

  try {
    return { ok: true, value: JSON.parse(raw) as unknown }
  } catch {
    return { ok: false, response: mobileError("BAD_REQUEST", INVALID_JSON) }
  }
}

export async function readJsonObject(
  request: Request,
): Promise<BodyResult<Record<string, unknown>>> {
  const body = await readOptionalJson(request)

  if (!body.ok) return body

  if (
    body.value === null ||
    typeof body.value !== "object" ||
    Array.isArray(body.value)
  ) {
    return {
      ok: false,
      response: mobileError("BAD_REQUEST", "This request needs a JSON object."),
    }
  }

  return { ok: true, value: body.value as Record<string, unknown> }
}

/**
 * Writes that act on the caller act on the caller, full stop. If a body names a
 * user, the client believes it can choose whose seat or membership this is, and
 * refusing loudly is kinder than ignoring it silently: a client built on that
 * assumption otherwise ships, and only fails once two students are involved.
 */
export function rejectClientSuppliedUser(body: unknown): NextResponse | null {
  if (
    body !== null &&
    typeof body === "object" &&
    ("userId" in body || "user_id" in body)
  ) {
    return mobileError(
      "BAD_REQUEST",
      "This action always applies to the signed-in account.",
    )
  }

  return null
}
