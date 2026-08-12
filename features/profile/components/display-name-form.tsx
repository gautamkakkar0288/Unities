"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { updateDisplayNameAction } from "@/features/profile/actions"
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/schemas/profile"

/**
 * Renaming yourself.
 *
 * The confirmation is worth the extra state: this write changes one word on a
 * page that already showed that word, so without it there is no way to tell a
 * successful save from a form that did nothing.
 */
export function DisplayNameForm({ name }: { name: string }) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name },
  })

  function onSubmit(values: UpdateProfileInput) {
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const failure = await updateDisplayNameAction(values)
      if (failure) {
        setError(failure.message)
        return
      }
      setSaved(true)
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field
        id="display-name"
        label="Display name"
        hint="What other students see next to anything you post."
        error={errors.name?.message}
        required
      >
        {(field) => (
          <Input autoComplete="name" {...field} {...register("name")} />
        )}
      </Field>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Saved.</Alert>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Spinner size="sm" label={null} />}
        {isPending ? "Saving\u2026" : "Save name"}
      </Button>
    </form>
  )
}
