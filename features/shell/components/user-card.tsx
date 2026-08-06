import { LogOut } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import type { UserRole } from "@/lib/db/schema"

import { signOutAction } from "../actions"

type UserCardProps = {
  name: string
  email: string | null
  role: string
}

function isUserRole(value: string): value is UserRole {
  return value in roleLabels
}

/**
 * Identity block at the foot of the sidebar: who you are signed in as, what
 * role you hold, and how to leave.
 *
 * Deliberately not a dropdown menu. Phase 3 did not ship a Menu primitive, and
 * a hand-rolled one would need full roving-focus keyboard handling to be
 * correct. A visible card is more accessible than a bad menu and costs the user
 * nothing - it also keeps the current role permanently visible, which supports
 * the trust-first requirement. The menu arrives with the Menu primitive.
 */
export function UserCard({ name, email, role }: UserCardProps) {
  const validRole = isUserRole(role)

  return (
    <div className="flex items-center gap-3 rounded-lg p-2">
      <Avatar name={name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium">{name}</p>
        {validRole ? (
          <Badge variant={roleBadgeVariant[role]} className="mt-1">
            {roleLabels[role]}
          </Badge>
        ) : (
          email && (
            <p className="truncate text-caption text-muted-foreground">{email}</p>
          )
        )}
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          // 44x44 minimum touch target per docs/UX/02.
          className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:size-9"
          aria-label="Sign out"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
