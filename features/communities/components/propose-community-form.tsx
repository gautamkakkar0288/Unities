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
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { proposeCommunityAction } from "@/features/communities/proposal-actions"
import { communityScopeLabel } from "@/lib/domain/community"
import type { CommunityRef, Interest } from "@/lib/domain/types"
import {
  proposeCommunityFormSchema,
  type ProposeCommunityFormInput,
} from "@/lib/schemas/community"
import { cn } from "@/lib/utils"

/**
 * The proposal form.
 *
 * The duplicate warning is the reason this screen is stateful rather than a
 * plain form post. A suspected duplicate is not an error - the student has done
 * nothing wrong, and the most useful outcome is usually that they join the
 * community that already exists. So the matches are rendered as links, and
 * carrying on is a deliberate second press rather than the default.
 *
 * There is no client-side duplicate check while typing. It would need the
 * viewer's entire visible directory in the browser to be accurate, and a check
 * that runs on a partial list is worse than none: it would stay silent on
 * exactly the campus communities it exists to catch.
 */

const SCOPES = ["UNIVERSITY", "CITY", "INTEREST"] as const

const controlClassName =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-body shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"

type Status =
  | { kind: "editing" }
  | { kind: "duplicates"; matches: CommunityRef[] }
  | { kind: "submitted" }

export function ProposeCommunityForm({ interests }: { interests: Interest[] }) {
  const [status, setStatus] = useState<Status>({ kind: "editing" })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposeCommunityFormInput>({
    resolver: zodResolver(proposeCommunityFormSchema),
    defaultValues: { scope: "UNIVERSITY", interestId: "" },
  })

  function submit(
    values: ProposeCommunityFormInput,
    acknowledgedDuplicates: boolean,
  ) {
    setError(null)
    startTransition(async () => {
      const result = await proposeCommunityAction({
        ...values,
        acknowledgedDuplicates,
      })

      if (!result.ok) {
        setError(result.message)
        return
      }

      if (result.data.status === "DUPLICATE_SUSPECTED") {
        setStatus({ kind: "duplicates", matches: result.data.matches })
        return
      }

      setStatus({ kind: "submitted" })
    })
  }

  if (status.kind === "submitted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proposal submitted</CardTitle>
          <CardDescription>
            It is now waiting for review. Nothing is visible to other students
            yet, and there is no queue you can watch - we will get back to you.
          </CardDescription>
          <Link
            href="/communities"
            className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-fit")}
          >
            Back to communities
          </Link>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form
      onSubmit={handleSubmit((values) => submit(values, false))}
      className="flex max-w-readable flex-col gap-4"
      noValidate
    >
      <Field id="name" label="Name" error={errors.name?.message} required>
        {(field) => <Input {...field} {...register("name")} />}
      </Field>

      <Field
        id="tagline"
        label="One line on what it is for"
        hint="This is what students read on the card before anything else."
        error={errors.tagline?.message}
        required
      >
        {(field) => <Input {...field} {...register("tagline")} />}
      </Field>

      <Field
        id="reason"
        label="Why should this exist?"
        hint="The reviewer sees this and little else. A sentence or two."
        error={errors.reason?.message}
        required
      >
        {(field) => <Textarea rows={4} {...field} {...register("reason")} />}
      </Field>

      <Field
        id="interestId"
        label="Interest"
        hint="Decides who this is recommended to."
        error={errors.interestId?.message}
        required
      >
        {(field) => (
          <select
            className={controlClassName}
            {...field}
            {...register("interestId")}
          >
            <option value="">Pick an interest</option>
            {interests.map((interest) => (
              <option key={interest.id} value={interest.id}>
                {interest.label}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        id="scope"
        label="Who is it for?"
        hint="Your campus and city are filled in from your account."
        error={errors.scope?.message}
        required
      >
        {(field) => (
          <select
            className={controlClassName}
            {...field}
            {...register("scope")}
          >
            {SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {communityScopeLabel[scope]}
              </option>
            ))}
          </select>
        )}
      </Field>

      {status.kind === "duplicates" && (
        <Alert variant="warning" title="This may already exist">
          <p>
            A split community is worse than a busy one - members, events, and
            recommendations end up divided between two names. Have a look
            first:
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {status.matches.map((match) => (
              <li key={match.id}>
                <Link
                  href={`/communities/${match.slug}`}
                  className="font-medium underline underline-offset-2"
                >
                  {match.name}
                </Link>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            disabled={isPending}
            onClick={handleSubmit((values) => submit(values, true))}
          >
            None of these - propose mine anyway
          </Button>
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Spinner size="sm" label={null} />}
        {isPending ? "Submitting…" : "Submit proposal"}
      </Button>
    </form>
  )
}
