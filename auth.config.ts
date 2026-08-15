import type { NextAuthConfig } from "next-auth"

import { prototypeRoutesEnabled } from "@/lib/prototype/access"

/**
 * Edge-safe auth config. Intentionally imports no database or bcrypt code so
 * the proxy can run on the edge runtime. The full config lives in `auth.ts`.
 */

/**
 * `/verify-email` is public for the same reason `/sign-in` is: the student
 * arriving on it is holding a link from their inbox and has no session yet.
 * Requiring one would make the link only work in the browser that registered,
 * which is exactly the case email verification exists to handle - a student who
 * signed up on a laptop and reads mail on their phone.
 *
 * The token is the credential. The page grants nothing without one.
 */
const publicRoutes = new Set(["/", "/sign-in", "/sign-up", "/verify-email"])

/**
 * Development-only route subtrees: the interactive prototype and the design
 * system gallery.
 *
 * They are public rather than authenticated because they are not the product -
 * requiring a session to view fixtures would be theatre. They are also only
 * public when `prototypeRoutesEnabled()` says the routes exist at all; the
 * layouts return 404 in the same conditions, so this list and the routes agree.
 *
 * Boundary-aware on purpose: `/prototypes-are-fun` must not become public
 * because `/prototype` is.
 */
const developmentPrefixes = ["/prototype", "/design"]

export default {
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      if (publicRoutes.has(pathname)) return true

      if (
        prototypeRoutesEnabled() &&
        developmentPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        )
      ) {
        return true
      }

      return Boolean(auth?.user)
    },
  },
} satisfies NextAuthConfig
