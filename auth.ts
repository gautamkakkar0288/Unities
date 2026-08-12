import { DrizzleAdapter } from "@auth/drizzle-adapter"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import NextAuth from "next-auth"
import type { Adapter } from "next-auth/adapters"
import Credentials from "next-auth/providers/credentials"

import authConfig from "@/auth.config"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import type { UserRole } from "@/lib/db/schema"
import { signInSchema } from "@/lib/schemas/auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // next-auth v5 beta ships its own nested copy of @auth/core, so the adapter
  // returned by @auth/drizzle-adapter is structurally identical but nominally a
  // different Adapter type. The cast names that packaging seam in one place
  // instead of letting it leak into every callback signature. Remove it once
  // next-auth v5 is stable and the duplicate dependency collapses.
  adapter: DrizzleAdapter(db) as Adapter,
  // Credentials requires the JWT strategy. The sessions table already exists so
  // moving to database sessions with OAuth providers is a config change (D8).
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1)

        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        )
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      // The JWT is an open record, so these arrive as unknown-shaped values.
      // They are written directly above and nowhere else, which is the only
      // reason narrowing them here is safe.
      if (token.id) session.user.id = token.id as string
      if (token.role) session.user.role = token.role as UserRole
      return session
    },
  },
})
