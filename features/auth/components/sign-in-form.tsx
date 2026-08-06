"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { appHomeHref } from "@/lib/navigation/config"
import { signInSchema, type SignInInput } from "@/lib/schemas/auth"

export function SignInForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

  function onSubmit(values: SignInInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await signIn("credentials", { ...values, redirect: false })
      if (result?.error) {
        // Generic message — never reveal whether the email exists.
        setFormError("Invalid email or password.")
        return
      }
      // Land inside the product, not back on the marketing page.
      router.push(appHomeHref)
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field id="email" label="Email" error={errors.email?.message} required>
        {(field) => (
          <Input type="email" autoComplete="email" {...field} {...register("email")} />
        )}
      </Field>

      <Field
        id="password"
        label="Password"
        error={errors.password?.message}
        required
      >
        {(field) => (
          <Input
            type="password"
            autoComplete="current-password"
            {...field}
            {...register("password")}
          />
        )}
      </Field>

      {formError && <Alert variant="error">{formError}</Alert>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Spinner size="sm" label={null} />}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
