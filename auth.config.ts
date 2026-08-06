import type { NextAuthConfig } from "next-auth"

/**
 * Edge-safe auth config. Intentionally imports no database or bcrypt code so
 * middleware can run on the edge runtime. The full config lives in `auth.ts`.
 */
const publicRoutes = new Set(["/", "/sign-in", "/sign-up"])

export default {
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      if (publicRoutes.has(pathname)) return true
      return Boolean(auth?.user)
    },
  },
} satisfies NextAuthConfig
