"use client"

import { useState, useTransition } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { assignRoleAction } from "@/features/admin/actions"
import { roleLabels } from "@/lib/auth/roles"
import type { UserRole } from "@/lib/db/schema"

/**
 * Change one person's role.
 *
 * The options are the roles an administrator has any reason to grant from this
 * screen. They are not the permission check - `assignRole` is, and it will
 * refuse a grant at or above the actor's own level, any change to a peer, and
 * any change to themselves. Filtering the list here would only hide the button;
 * the rule that matters runs on the server, and its refusal is shown verbatim
 * so an admin learns why rather than finding the control mysteriously inert.
 */
const GRANTABLE: UserRole[] = ["STUDENT", "ORGANIZER", "COMMUNITY_MODERATOR"]

const selectClassName =
  "h-9 rounded-lg border border-input bg-background px-2 text-body-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function RoleControl({
  userId,
  personName,
  currentRole,
}: {
  userId: string
  personName: string
  currentRole: UserRole
}) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    setError(null)
    startTransition(async () => {
      const failure = await assignRoleAction({ userId, role })
      if (failure) setError(failure.message)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`role-${userId}`}>
          Role for {personName}
        </label>
        <select
          id={`role-${userId}`}
          className={selectClassName}
          value={role}
          disabled={isPending}
          onChange={(event) => setRole(event.target.value as UserRole)}
        >
          {GRANTABLE.map((option) => (
            <option key={option} value={option}>
              {roleLabels[option]}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || role === currentRole}
          onClick={save}
        >
          {isPending && <Spinner size="sm" label={null} />}
          Save role
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
