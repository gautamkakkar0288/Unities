import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  isMutable,
  notificationKindLabel,
} from "@/lib/domain/notifications"
import type { NotificationKind } from "@/lib/domain/types"
import { viewerProfile } from "@/lib/prototype/fixtures"
import { cn } from "@/lib/utils"

export const metadata = { title: "Settings" }

/**
 * A read-only stand-in for a real switch primitive.
 *
 * `role="switch"` with `aria-checked` is the correct semantic, so the markup is
 * already right even though nothing toggles. When the Switch primitive is built
 * it replaces this and the screens do not change shape.
 */
function SettingSwitch({
  id,
  label,
  description,
  checked,
  locked = false,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  locked?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          {locked && <Badge variant="neutral">Always on</Badge>}
        </div>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={locked}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors duration-150 ease-standard focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60",
          checked ? "bg-primary" : "bg-muted border-border",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-5 rounded-full bg-card shadow-card transition-transform duration-150 ease-standard",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  )
}

const notificationKinds: NotificationKind[] = [
  "EVENT_REMINDER",
  "MENTION",
  "COMMUNITY_POST",
  "MEMBERSHIP",
  "MODERATION",
]

export default function PrototypeSettingsPage() {
  const profile = viewerProfile

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 9"
        title="Settings"
        description="Account, privacy, and notification preferences. Grouped by the question a student is actually asking, not by database table."
        notes={[
          "Switches are semantic but do not persist - the Switch primitive is not built",
          "Nothing saves; forms land with Phase 9",
          "Account deletion needs a real data-retention policy first",
        ]}
      />

      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              How you appear to other students at Chitkara.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-bio">Bio</Label>
              <Textarea
                id="settings-bio"
                rows={3}
                defaultValue={profile.bio}
                aria-describedby="settings-bio-hint"
              />
              <p
                id="settings-bio-hint"
                className="text-caption text-muted-foreground"
              >
                Up to 200 characters. Visible to anyone in your university.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-interests">Interests</Label>
              <ul className="flex flex-wrap gap-2" id="settings-interests">
                {profile.interests.map((interest) => (
                  <li key={interest.id}>
                    <Badge variant="brand">{interest.label}</Badge>
                  </li>
                ))}
              </ul>
              <p className="text-caption text-muted-foreground">
                Interests drive what you see on Explore and Home.
              </p>
            </div>
            <div>
              <Button type="button" size="lg">
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>
              Defaults lean private. A student should have to opt into being
              findable, not discover they always were.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <SettingSwitch
              id="privacy-discoverable"
              label="Show me in search"
              description="Other students at Chitkara can find your profile by name."
              checked
            />
            <SettingSwitch
              id="privacy-attendance"
              label="Show events I am attending"
              description="Your name appears in the attendee preview on event pages."
              checked={false}
            />
            <SettingSwitch
              id="privacy-dms"
              label="Allow direct messages"
              description="Only from students who share a community with you."
              checked
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Per category, so muting campus chatter never means missing the
              event you registered for.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {notificationKinds.map((kind) => (
              <SettingSwitch
                key={kind}
                id={`notify-${kind}`}
                label={notificationKindLabel[kind]}
                description={
                  isMutable(kind)
                    ? "In app and email."
                    : "Cannot be muted - it affects your standing or answers a request you made."
                }
                checked
                locked={!isMutable(kind)}
              />
            ))}
          </CardContent>
        </Card>

        <Separator />

        <Card className="border-destructive-border">
          <CardHeader>
            <CardTitle>Delete account</CardTitle>
            <CardDescription>
              Removes your profile, posts, and registrations. Events you
              organised are transferred to a community moderator rather than
              deleted, so other students do not lose what they signed up for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" size="lg">
              Delete my account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
