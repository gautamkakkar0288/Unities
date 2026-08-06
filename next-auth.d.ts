import type { DefaultSession } from "next-auth"

import type { UserRole } from "@/lib/db/schema"

// Surfaces the Cirqles role and user id on the session so every server
// component and route handler can authorise without an extra query.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: UserRole
  }
}
