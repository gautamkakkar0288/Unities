import type { NextAuthConfig } from "next-auth"

import { prototypeRoutesEnabled } from "@/lib/prototype/access"

/**
 * Edge-safe auth config. Intentionally imports no database or bcrypt code so
 * the proxy can run on the edge runtime. The full config lives in `auth.ts`.
 */
const publicRoutes = new Set(["/", "/sign-in", "/sign-up"])

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
