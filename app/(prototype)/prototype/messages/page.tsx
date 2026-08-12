import { Info, Send } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  canReply,
  conversationScopeLabel,
  conversationScopeTone,
} from "@/lib/domain/messaging"
import {
  conversations,
  openConversation,
  openConversationMessages,
  prototypeNow,
} from "@/lib/prototype/fixtures"
import { formatRelativeTime, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata = { title: "Messages" }

/**
 * Scoped messaging.
 *
 * Every conversation states why it exists - official channel, community,
 * event, or a direct message justified by a shared community. That label is not
 * decoration: it is the permission model made visible, so a student understands
 * why they can be contacted and by whom.
 *
 * Two panes on desktop, list-then-thread on mobile. The real screen routes the
 * thread separately so the back button behaves.
 */
export default function PrototypeMessagesPage() {
  const replyAllowed = canReply(openConversation.scope)

  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 11"
        title="Messages"
        description="Conversations that exist for a reason: an official channel, a community you belong to, an event you registered for, or a mutual community."
        notes={[
          "Sending is static - realtime delivery is the hard part of Phase 11",
          "Read receipts, typing indicators, and attachments are out of scope",
          "Blocking and reporting hook into the Operations Center",
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section aria-label="Conversations" className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {conversations.map((conversation) => {
              const active = conversation.id === openConversation.id
              return (
                <li key={conversation.id}>
                  <Card
                    interactive
                    className={cn(
                      "gap-0",
                      active && "border-primary-border bg-primary-subtle/30",
                    )}
                  >
                    <CardContent className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={conversationScopeTone[conversation.scope]}
                        >
                          {conversationScopeLabel[conversation.scope]}
                        </Badge>
                        {conversation.unreadCount > 0 && (
                          <span
                            className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-caption font-medium text-primary-foreground"
                            data-numeric
                          >
                            {conversation.unreadCount}
                            <span className="sr-only">unread messages</span>
                          </span>
                        )}
                      </div>
                      <p className="truncate text-body-sm font-medium">
                        {conversation.title}
                      </p>
                      <p className="truncate text-caption text-muted-foreground">
                        {conversation.lastMessagePreview}
                      </p>
                      <time
                        dateTime={conversation.lastMessageAt}
                        className="text-caption text-muted-foreground"
                      >
                        {formatRelativeTime(
                          conversation.lastMessageAt,
                          prototypeNow,
                        )}
                      </time>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-label={`Conversation: ${openConversation.title}`}>
          <Card className="gap-0">
            <CardContent className="flex flex-col gap-1 border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-h4">{openConversation.title}</h2>
                <Badge variant={conversationScopeTone[openConversation.scope]}>
                  {conversationScopeLabel[openConversation.scope]}
                </Badge>
              </div>
              <p className="text-caption text-muted-foreground">
                {openConversation.subtitle}
              </p>
            </CardContent>

            <CardContent className="flex flex-col gap-4 py-6">
              <p className="flex items-start gap-2 rounded-lg border border-info-border bg-info-subtle px-3 py-2 text-caption text-info-foreground">
                <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                This channel closes 48 hours after the event so it does not
                become a group chat nobody moderates.
              </p>

              <ul className="flex flex-col gap-4">
                {openConversationMessages.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.fromViewer && "flex-row-reverse",
                    )}
                  >
                    <Avatar
                      size="xs"
                      name={message.author.name}
                      src={message.author.avatarUrl}
                    />
                    <div
                      className={cn(
                        "flex max-w-[80%] flex-col gap-1",
                        message.fromViewer && "items-end",
                      )}
                    >
                      <p className="text-caption text-muted-foreground">
                        {message.fromViewer ? "You" : message.author.name}
                        {" - "}
                        <time dateTime={message.sentAt}>
                          {formatTime(message.sentAt)}
                        </time>
                      </p>
                      <p
                        className={cn(
                          "rounded-lg px-3 py-2 text-body-sm",
                          message.fromViewer
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {message.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardContent className="flex flex-col gap-2 border-t border-border pt-4">
              {replyAllowed ? (
                <>
                  <Label htmlFor="message-body" className="sr-only">
                    Message
                  </Label>
                  <div className="flex items-end gap-2">
                    <Textarea
                      id="message-body"
                      rows={2}
                      placeholder="Write a message"
                    />
                    <Button type="button" size="lg" aria-label="Send message">
                      <Send aria-hidden="true" />
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-caption text-muted-foreground">
                  This is a broadcast channel. Replies are not delivered.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
