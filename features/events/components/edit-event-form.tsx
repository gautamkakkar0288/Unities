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
import { updateEventAction } from "@/features/events/edit-actions"
import {
  isoToLocalDateTime,
  localDateTimeToIso,
  paiseToRupees,
  rupeesToPaise,
  wholeNumberOrNull,
  wholeNumberToString,
} from "@/lib/domain/event-input"
import { eventModeLabel } from "@/lib/domain/registration"
import type { EventMode } from "@/lib/domain/types"
import {
  editEventFormSchema,
  type EditEventFormInput,
} from "@/lib/schemas/event-edit"

/**
 * Correcting an event that is already published.
 *
 * Deliberately close to the create form, because it is the same set of fields
 * and an organiser should not have to learn a second screen. Two differences
 * matter, and both are about the people already holding seats.
 *
 * The type of event is not editable, so it is shown rather than offered. A
 * workshop becoming a tournament is a different event, not an edited one.
 *
 * And a successful save does not always navigate away: if adding seats let
 * students off the waitlist, that is a consequence the organiser cannot see
 * from the event page, and nothing has notified those students yet.
 */

const MODES: EventMode[] = ["IN_PERSON", "ONLINE", "HYBRID"]

const controlClassName =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-body shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"

export function EditEventForm({
  eventId,
  slug,
  kindLabel,
  waitlistCount,
  event,
}: {
  eventId: string
  slug: string
  kindLabel: string
  waitlistCount: number
  event: {
    title: string
    description: string
    mode: EventMode
    venue: string
    startsAt: string
    endsAt: string
    registrationClosesAt: string | null
    capacity: number | null
    feeInPaise: number | null
  }
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [promoted, setPromoted] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditEventFormInput>({
    resolver: zodResolver(editEventFormSchema),
    // The stored event, converted back into what an organiser would have typed.
    // The times are rendered in this browser's zone, not sliced out of the ISO
    // string, or a 10:00 workshop would open its own form showing 04:30.
    defaultValues: {
      title: event.title,
      description: event.description,
      mode: event.mode,
      venue: event.venue,
      startsAt: isoToLocalDateTime(event.startsAt),
      endsAt: isoToLocalDateTime(event.endsAt),
      registrationClosesAt: isoToLocalDateTime(event.registrationClosesAt),
      capacity: wholeNumberToString(event.capacity),
      feeInRupees: paiseToRupees(event.feeInPaise),
    },
  })

  function submit(values: EditEventFormInput) {
    setError(null)
    setPromoted(null)

    const startsAt = localDateTimeToIso(values.startsAt)
    const endsAt = localDateTimeToIso(values.endsAt)

    // The schema already refused an unreadable date, so this is a guard rather
    // than a message anyone should see.
    if (!startsAt || !endsAt) {
      setError("Those dates could not be read. Please pick them again.")
      return
    }

    startTransition(async () => {
      const result = await updateEventAction({
        eventId,
        title: values.title,
        description: values.description,
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

      if (result.data.promoted > 0) {
        // Stay, and say what happened to the queue. Bouncing to the event page
        // would hide the only consequence of this edit the organiser cannot see
        // there - and these students have not been told anything yet.
        setPromoted(result.data.promoted)
        router.refresh()
        return
      }

      router.push(`/events/${slug}`)
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

      {/*
        Shown, not offered. A disabled select would invite the organiser to hunt
        for the permission to change it, when the answer is that there is not
        one: a workshop becoming a tournament is a different event.
      */}
      <div className="flex flex-col gap-1">
        <span className="text-label">Type</span>
        <p className="text-body-sm">{kindLabel}</p>
        <p className="text-caption text-muted-foreground">
          The type cannot be changed. Cancel this and create a new event if it
          has become something else.
        </p>
      </div>

      <Field
        id="mode"
        label="How is it run?"
        error={errors.mode?.message}
        required
      >
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

      <Field
        id="startsAt"
        label="Starts"
        error={errors.startsAt?.message}
        required
      >
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
        hint={
          waitlistCount > 0
            ? `Leave blank for no limit. ${waitlistCount} ${waitlistCount === 1 ? "student is" : "students are"} waiting - adding seats lets them in straight away, longest wait first.`
            : "Leave blank for no limit. Once these are gone, students join a waitlist."
        }
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

      {promoted !== null && (
        <Alert variant="success" title="Saved, and the waitlist moved">
          {promoted === 1
            ? "1 student came off the waitlist and now has a seat."
            : `${promoted} students came off the waitlist and now have seats.`}{" "}
          Cirqles has not told them yet, so please let them know.
        </Alert>
      )}

      <p className="text-caption text-muted-foreground">
        Students who have already registered are not notified of changes yet.
      </p>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Spinner size="sm" label={null} />}
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}
