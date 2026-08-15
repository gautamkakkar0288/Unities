import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { PageHeader } from "@/features/shell/components/page-header"
import { RequestVerificationForm } from "@/features/verification/components/request-verification-form"
import { getCommunityBySlug } from "@/lib/services/communities"

export const metadata: Metadata = { title: "Get verified" }

/**
 * Where a club owner asks to be recognised.
 *
 * The page does not check ownership before rendering the form. It could, but it
 * would be a second opinion about who owns this club, and the service already
 * holds the first one - a member who wanders in here gets a clear refusal on
 * submit rather than a 404 that suggests the club does not exist.
 */
export default async function CommunityVerifyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const session = await auth()
  if (!session?.user) redirect("/sign-in")

  const community = await getCommunityBySlug({
    slug,
    viewerId: session.user.id,
  })
  if (!community) notFound()

  return (
    <>
      <PageHeader
        title="Get verified"
        description={`Ask an administrator to confirm that ${community.name} is a real club at your university.`}
      />

      <div className="flex max-w-readable flex-col gap-4">
        <Link
          href={`/communities/${community.slug}`}
          className="text-body-sm text-muted-foreground underline underline-offset-2 hover:text-primary"
        >
          Back to {community.name}
        </Link>

        <p className="text-body-sm text-muted-foreground">
          Verified clubs carry a badge students can trust, and their owners can
          create events. Only the owner of a community can ask.
        </p>

        <RequestVerificationForm
          communitySlug={community.slug}
          communityName={community.name}
        />
      </div>
    </>
  )
}
