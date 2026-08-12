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
import { registerUser } from "@/features/auth/actions"
import { signUpSchema, type SignUpInput } from "@/lib/schemas/auth"

export function SignUpForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) })

  function onSubmit(values: SignUpInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await registerUser(values)
      if (result.status === "error") {
        setFormError(result.message)
        return
      }
      // Sign the new account straight in so registration is a single step.
      await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })
      // Into the product rather than the marketing page. The shell sends a
      // student with no interests to onboarding, so this is what makes sign up
      // land on the first real step instead of the homepage.
      router.push("/home")
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field id="name" label="Full name" error={errors.name?.message} required>
        {(field) => (
          <Input autoComplete="name" {...field} {...register("name")} />
        )}
      </Field>

      <Field id="email" label="Email" error={errors.email?.message} required>
        {(field) => (
          <Input type="email" autoComplete="email" {...field} {...register("email")} />
        )}
      </Field>

      <Field
        id="password"
        label="Password"
        hint="At least 8 characters."
        error={errors.password?.message}
        required
      >
        {(field) => (
          <Input
            type="password"
            autoComplete="new-password"
            {...field}
            {...register("password")}
          />
        )}
      </Field>

      {formError && <Alert variant="error">{formError}</Alert>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Spinner size="sm" label={null} />}
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  )
}
