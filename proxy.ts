import NextAuth from "next-auth"

import authConfig from "@/auth.config"

/**
 * Route protection, formerly middleware.ts.
 *
 * Next 16 deprecated the `middleware` file convention in favour of `proxy`;
 * `next build` warns on every run until the file is renamed. The contents and
 * the matcher are unchanged, so behaviour is identical - only the filename the
 * framework looks for has moved.
 *
 * This remains an optimisation rather than a security boundary. The real guard
 * is the session check in app/(app)/layout.tsx, which runs on the server for
 * every authenticated render and cannot be bypassed by a matcher gap.
 *
 * Uses the edge-safe config only - no database access here.
 */
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
