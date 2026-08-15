import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { Alert } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { CreateEventForm } from "@/features/events/components/create-event-form"
import { PageHeader } from "@/features/shell/components/page-header"
import { getCommunityBySlug } from "@/lib/services/communities"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "New event" }

/**
 * Publishing an event, from inside the community that will host it.
 *
 * There is no global "new event" screen because the first question is always
 * which community is putting it on, and that question decides whether the
 * organiser is allowed at all. Putting the form here makes the answer part of
 * the address.
 *
 * The gate is repeated in the service, where it is enforced against the row at
 * write time. This check only decides what to render - a student who guesses
 * the URL gets nothing, and an owner of an unverified community gets an
 * explanation rather than a form that will refuse them at the end.
 */
export default async function NewEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const { slug } = await params
  const community = await getCommunityBySlug({
    slug,
    viewerId: session.user.id,
  })

  if (!community) notFound()

  // Not an owner: the same answer as a page that does not exist. Telling a
  // student "you are not allowed here" only invites them to wonder what is.
  if (community.viewerMembership !== "OWNER") notFound()

  if (community.verification !== "VERIFIED") {
    return (
      <>
        <PageHeader title="New event" />
        <Alert variant="warning" title="This community is not verified yet">
          <p>
            Events are how students commit their time, and a verified community
            is how they know who is asking. {community.name} has to be verified
            before it can publish.
          </p>
          <Link
            href={`/communities/${community.slug}/verify`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-fit")}
          >
            Request verification
          </Link>
        </Alert>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="New event"
        description={`Published as ${community.name}.`}
      />
      <CreateEventForm
        communitySlug={community.slug}
        communityName={community.name}
      />
    </>
  )
}
