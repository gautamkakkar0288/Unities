import NextAuth from "next-auth"

import authConfig from "@/auth.config"

// Uses the edge-safe config only — no database access in middleware.
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
