import { z } from "zod"

/**
 * Single validation contract for authentication, shared by client forms,
 * server actions, and the Auth.js credentials provider.
 */
export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
})

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    // bcrypt truncates beyond 72 bytes; cap explicitly instead of silently.
    .max(72, "Password must be at most 72 characters"),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
