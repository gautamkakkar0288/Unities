import type { NextAuthConfig } from "next-auth"

/**
 * Edge-safe auth config. Intentionally imports no database or bcrypt code so
 * middleware can run on the edge runtime. The full config lives in `auth.ts`.
 */
const publicRoutes = new Set([
  "/",
  "/sign-in",
  "/sign-up",
  // Internal design-system gallery. Remove from this list (or delete the
  // route) before the public launch hardening pass in Phase 16.
  "/design",
])

/**
 * Public route subtrees. The prototype is many nested screens rather than one
 * path, so an exact-match set cannot express it. Boundary-aware on purpose:
 * `/prototypes-are-fun` must not become public because `/prototype` is.
 *
 * Removed alongside the `/design` gallery in Phase 16.
 */
const publicPrefixes = ["/prototype"]

export default {
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      if (publicRoutes.has(pathname)) return true
      if (
        publicPrefixes.some(
          (prefix) =>
            pathname === prefix || pathname.startsWith(`${prefix}/`),
        )
      ) {
        return true
      }
      return Boolean(auth?.user)
    },
  },
} satisfies NextAuthConfig
