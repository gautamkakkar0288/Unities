"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { createEventAction } from "@/features/events/organiser-actions"
import { creatableEventKinds, eventKindLabel } from "@/lib/domain/event"
import {
  localDateTimeToIso,
  rupeesToPaise,
  wholeNumberOrNull,
} from "@/lib/domain/event-input"
import { eventModeLabel } from "@/lib/domain/registration"
import type { EventMode } from "@/lib/domain/types"
import {
  createEventFormSchema,
  type CreateEventFormInput,
} from "@/lib/schemas/event"

/**
 * Publishing an event.
 *
 * The times are the hard part. A `datetime-local` input has no timezone, so the
 * conversion to an absolute instant happens here, in the organiser's browser,
 * on the campus the event is actually on - doing it on the server would read
 * every "10:00" as UTC and move the whole calendar by five and a half hours.
 *
 * Capacity and fee are optional and blank means something specific in each
 * case: no capacity is unlimited, no fee is free. That is why they are text
 * inputs converted deliberately rather than number inputs defaulting to zero -
 * an event with zero seats is a mistake, and the schema refuses it.
 */

const MODES: EventMode[] = ["IN_PERSON", "ONLINE", "HYBRID"]

const controlClassName =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-body shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"

export function CreateEventForm({
  communitySlug,
  communityName,
}: {
  communitySlug: string
  communityName: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventFormInput>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      kind: "WORKSHOP",
      mode: "IN_PERSON",
      venue: "",
      startsAt: "",
      endsAt: "",
      registrationClosesAt: "",
      capacity: "",
      feeInRupees: "",
    },
  })

  function submit(values: CreateEventFormInput) {
    setError(null)

    const startsAt = localDateTimeToIso(values.startsAt)
    const endsAt = localDateTimeToIso(values.endsAt)

    // The schema already refused an unparseable date, so this is a guard rather
    // than a message anyone should see.
    if (!startsAt || !endsAt) {
      setError("Those dates could not be read. Please pick them again.")
      return
    }

    startTransition(async () => {
      const result = await createEventAction({
        communitySlug,
        title: values.title,
        description: values.description,
        kind: values.kind,
        mode: values.mode,
        venue: values.venue,
        startsAt,
        endsAt,
        registrationClosesAt: localDateTimeToIso(values.registrationClosesAt),
        capacity: wholeNumberOrNull(values.capacity),
        feeInPaise: rupeesToPaise(values.feeInRupees),
      })

      if (!result.ok) {
        setError(result.message)
        return
      }

      // Straight to the event itself. An organiser's next question is always
      // "what does this look like to a student", and the answer is one page.
      router.push(`/events/${result.data.slug}`)
    })
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex max-w-readable flex-col gap-4"
      noValidate
    >
      <Field id="title" label="Title" error={errors.title?.message} required>
        {(field) => <Input {...field} {...register("title")} />}
      </Field>

      <Field
        id="description"
        label="What is it?"
        hint="What a student should know before deciding to come."
        error={errors.description?.message}
      >
        {(field) => (
          <Textarea rows={5} {...field} {...register("description")} />
        )}
      </Field>

      <Field id="kind" label="Type" error={errors.kind?.message} required>
        {(field) => (
          <select className={controlClassName} {...field} {...register("kind")}>
            {creatableEventKinds.map((kind) => (
              <option key={kind} value={kind}>
                {eventKindLabel[kind]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field id="mode" label="How is it run?" error={errors.mode?.message} required>
        {(field) => (
          <select className={controlClassName} {...field} {...register("mode")}>
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {eventModeLabel[mode]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        id="venue"
        label="Where"
        hint="A room and building, or a joining link for an online event."
        error={errors.venue?.message}
      >
        {(field) => <Input {...field} {...register("venue")} />}
      </Field>

      <Field id="startsAt" label="Starts" error={errors.startsAt?.message} required>
        {(field) => (
          <Input type="datetime-local" {...field} {...register("startsAt")} />
        )}
      </Field>

      <Field id="endsAt" label="Ends" error={errors.endsAt?.message} required>
        {(field) => (
          <Input type="datetime-local" {...field} {...register("endsAt")} />
        )}
      </Field>

      <Field
        id="registrationClosesAt"
        label="Registration closes"
        hint="Leave blank to keep it open until the event starts."
        error={errors.registrationClosesAt?.message}
      >
        {(field) => (
          <Input
            type="datetime-local"
            {...field}
            {...register("registrationClosesAt")}
          />
        )}
      </Field>

      <Field
        id="capacity"
        label="Seats"
        hint="Leave blank for no limit. Once these are gone, students join a waitlist."
        error={errors.capacity?.message}
      >
        {(field) => (
          <Input inputMode="numeric" {...field} {...register("capacity")} />
        )}
      </Field>

      <Field
        id="feeInRupees"
        label="Fee in rupees"
        hint="Leave blank if it is free. Cirqles does not collect money - this is shown to students so they can bring it."
        error={errors.feeInRupees?.message}
      >
        {(field) => (
          <Input inputMode="decimal" {...field} {...register("feeInRupees")} />
        )}
      </Field>

      {error && <Alert variant="error">{error}</Alert>}

      <p className="text-caption text-muted-foreground">
        This publishes immediately to everyone who can see {communityName}.
      </p>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Spinner size="sm" label={null} />}
        {isPending ? "Publishing…" : "Publish event"}
      </Button>
    </form>
  )
}
