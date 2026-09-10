import type { listCommunityLeads } from "@/lib/services/community-members"
import type {
  getCommunityBySlug,
  listCommunitiesForViewer,
} from "@/lib/services/communities"

type CommunityListItem = Awaited<
  ReturnType<typeof listCommunitiesForViewer>
>[number]
type CommunityDetail = NonNullable<
  Awaited<ReturnType<typeof getCommunityBySlug>>
>
type CommunityLead = Awaited<ReturnType<typeof listCommunityLeads>>[number]

/**
 * Communities on the wire. Same reasoning as events: the nested `place` and
 * `interest` objects the services already build, plus the flat identifiers the
 * mobile models read.
 *
 * `viewerMembership` comes from the service's viewer-scoped join, so it is the
 * caller's own state and collapses to `NONE` when there is no row. It is never
 * taken from a query parameter.
 */

function baseFields(community: CommunityListItem) {
  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    tagline: community.tagline,
    kind: community.kind,
    scope: community.scope,
    joinPolicy: community.joinPolicy,
    verification: community.verification,
    memberCount: community.memberCount,
    place: community.place,
    placeId: community.place?.id ?? null,
    interest: community.interest,
    interestId: community.interest.id,
    viewerMembership: community.viewerMembership,
  }
}

export function serializeCommunitySummary(community: CommunityListItem) {
  return baseFields(community)
}

/**
 * Leads only - the owners and moderators `listCommunityLeads` returns. Ordinary
 * members, pending applicants and invitees are not part of this shape, which is
 * a decision the existing service already made and this layer must not undo:
 * a member list is not public information.
 */
function serializeLead(lead: CommunityLead) {
  return {
    id: lead.id,
    name: lead.name,
    avatarUrl: lead.avatarUrl,
    imageUrl: lead.avatarUrl,
    role: lead.role,
    state: lead.state,
  }
}

export function serializeCommunityDetail(
  community: CommunityDetail,
  leads: CommunityLead[],
) {
  return {
    ...baseFields(community),
    about: community.about,
    guidelines: community.guidelines,
    moderators: leads.map(serializeLead),
  }
}
