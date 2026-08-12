import { Bookmark, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import { PageHeader } from "@/features/shell/components/page-header"
import { signOutAction } from "@/features/shell/actions"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Profile" }

/**
 * The only shell page with real content, because it can have some: the session
 * already knows who you are.
 *
 * It also carries the mobile entry points for Communities and Saved. The mobile
 * bar is capped at five items, so docs/UX/00 routes those two through a primary
 * screen rather than a permanent tab - this is that route, and without it they
 * would be unreachable on a phone.
 */
export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const { name, email, role } = session.user
  const displayName = name ?? email ?? "Your account"

  return (
    <>
      <PageHeader title="Profile" />

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
            <Avatar name={displayName} size="xl" />
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <h2 className="text-h3">{displayName}</h2>
              {email && (
                <p className="text-body-sm text-muted-foreground">{email}</p>
              )}
              <Badge variant={roleBadgeVariant[role]}>{roleLabels[role]}</Badge>
            </div>
          </CardContent>
        </Card>

        <nav aria-label="Your activity" className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/communities"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Users className="size-5 text-primary" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-body font-medium">Communities</span>
              <span className="text-caption text-muted-foreground">
                Clubs and societies you joined
              </span>
            </span>
          </Link>

          <Link
            href="/saved"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Bookmark className="size-5 text-primary" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-body font-medium">Saved</span>
              <span className="text-caption text-muted-foreground">
                Things you bookmarked
              </span>
            </span>
          </Link>
        </nav>

        {/* Sign out lives here too - the sidebar is desktop only. */}
        <form action={signOutAction} className="lg:hidden">
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </>
  )
}
