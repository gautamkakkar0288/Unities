import { Bookmark, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DisplayNameForm } from "@/features/profile/components/display-name-form"
import { PageHeader } from "@/features/shell/components/page-header"
import { signOutAction } from "@/features/shell/actions"
import { roleBadgeVariant, roleLabels } from "@/lib/auth/roles"
import { membershipBadgeLabel } from "@/lib/domain/membership"
import { getProfile } from "@/lib/services/profile"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Profile" }

/**
 * The student's own profile, read from the database rather than the session.
 *
 * The session knows a name, an email, and a role, which is why this page could
 * exist before there was a database behind it. It cannot know which communities
 * you joined or which interests you picked, and it holds a name from whenever
 * you last signed in - so everything here comes from `getProfile`.
 *
 * Bio, username, programme, badges, and an events-attended count all appear in
 * the domain's `ProfileDetail` and in the prototype. None of them exist in the
 * `users` table, so none of them are rendered here. A profile that displays
 * "0 events attended" next to invented fields looks more finished and tells the
 * student less.
 */
export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const profile = await getProfile(session.user.id)
  // The session is valid but the row is gone - a deleted account holding a live
  // token. Signing out is the only honest next step.
  if (!profile) redirect("/sign-in")

  const displayName = profile.name ?? profile.email

  return (
    <>
      <PageHeader title="Profile" />

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
            <Avatar
              name={displayName}
              src={profile.avatarUrl ?? undefined}
              size="xl"
            />
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <h2 className="text-h3">{displayName}</h2>
              <p className="text-body-sm text-muted-foreground">
                {profile.email}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant={roleBadgeVariant[profile.role]}>
                  {roleLabels[profile.role]}
                </Badge>
                {profile.university && (
                  <Badge variant="neutral">{profile.university.name}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your name</CardTitle>
          </CardHeader>
          <CardContent>
            <DisplayNameForm name={profile.name ?? ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>
              What Cirqles recommends to you is built from these.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {profile.interests.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <li
                    key={interest.id}
                    className="rounded-full border border-border bg-muted px-3 py-1 text-body-sm"
                  >
                    {interest.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-muted-foreground">
                You have no interests saved, so there is nothing to recommend
                you yet.
              </p>
            )}

            <Link
              href="/profile/interests"
              className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            >
              Edit interests
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communities</CardTitle>
            <CardDescription>
              Everything you run, belong to, or have asked to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.communities.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {profile.communities.map((community) => (
                  <li key={community.id}>
                    <Link
                      href={`/communities/${community.slug}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors duration-150 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="text-body font-medium">
                        {community.name}
                      </span>
                      {membershipBadgeLabel[community.state] && (
                        <Badge variant="neutral">
                          {membershipBadgeLabel[community.state]}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-body-sm text-muted-foreground">
                  You have not joined anything yet.
                </p>
                <Link
                  href="/communities"
                  className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
                >
                  Browse communities
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/*
          The mobile bar is capped at five items, so docs/UX/00 routes
          Communities and Saved through this screen. Without these they are
          unreachable on a phone.
        */}
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
