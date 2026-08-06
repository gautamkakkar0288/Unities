import { DrizzleAdapter } from "@auth/drizzle-adapter"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import authConfig from "@/auth.config"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { signInSchema } from "@/lib/schemas/auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
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
      if (token.id) session.user.id = token.id
      if (token.role) session.user.role = token.role
      return session
    },
  },
})
