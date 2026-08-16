"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Alert } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { requestVerificationAction } from "@/features/verification/actions"
import {
  requestVerificationSchema,
  type RequestVerificationInput,
} from "@/lib/schemas/verification-request"
import { cn } from "@/lib/utils"

/**
 * The evidence form.
 *
 * The slug is a hidden field rather than a prop threaded into the action call,
 * so the same schema validates on both sides of the wire. It is not a security
 * boundary either way - the service looks the community up itself and checks
 * that this account owns it, so editing the hidden value in devtools gets you a
 * refusal for somebody else's club rather than a request on it.
 *
 * There is no draft saving and no re-editing. A request is one short paragraph,
 * and a rejected club may simply ask again.
 */
export function RequestVerificationForm({
  communitySlug,
  communityName,
}: {
  communitySlug: string
  communityName: string
}) {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestVerificationInput>({
    resolver: zodResolver(requestVerificationSchema),
    defaultValues: { communitySlug, evidence: "" },
  })

  function submit(values: RequestVerificationInput) {
    setError(null)
    startTransition(async () => {
      const failure = await requestVerificationAction(values)

      if (failure) {
        setError(failure.message)
        return
      }

      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Request sent</CardTitle>
          <CardDescription>
            {communityName} now shows as pending while an administrator checks
            it. If it is approved you will be able to create events for it.
          </CardDescription>
          <Link
            href={`/communities/${communitySlug}`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-fit")}
          >
            Back to {communityName}
          </Link>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex max-w-readable flex-col gap-4"
      noValidate
    >
      <input type="hidden" {...register("communitySlug")} />

      <Field
        id="evidence"
        label="How can we check this club is real?"
        hint="A registration number, the faculty advisor's name, or a link to something official. One or two sentences is plenty."
        error={errors.evidence?.message}
        required
      >
        {(field) => <Textarea rows={5} {...field} {...register("evidence")} />}
      </Field>

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Spinner size="sm" label={null} />}
        {isPending ? "Sending…" : "Request verification"}
      </Button>
    </form>
  )
}
