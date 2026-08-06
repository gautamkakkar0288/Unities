import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { CommentItem } from "@/features/posts/components/comment-item"
import { PostCard } from "@/features/posts/components/post-card"
import { ScreenHeader } from "@/features/prototype/components/screen-header"
import {
  focusPost,
  focusPostComments,
  prototypeNow,
  viewer,
} from "@/lib/prototype/fixtures"

export const metadata = { title: "Post detail" }

/**
 * A single post and its thread.
 *
 * The composer sits above the comments, not below them. Burying the reply box
 * under a long thread is the most common way a discussion screen discourages
 * the thing it exists to encourage.
 */
export default function PrototypePostPage() {
  return (
    <div className="flex flex-col">
      <ScreenHeader
        phase="Phase 7"
        title="Post detail"
        description="One post, its full body, and the comment thread underneath."
        notes={[
          "The composer does not submit - no mutations exist yet",
          "Nested replies, mentions, and edit history come with Phase 7",
          "Report and moderate actions land with Phase 13",
        ]}
      />

      <div className="flex max-w-3xl flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/prototype/community" />}
        >
          <ArrowLeft aria-hidden="true" />
          Back to Robotics Club
        </Button>

        <PostCard
          post={focusPost}
          now={prototypeNow}
          href="/prototype/post"
          communityHref="/prototype/community"
        />

        <Card>
          <CardContent className="flex flex-col gap-3">
            <Label htmlFor="prototype-comment">Add a comment</Label>
            <div className="flex gap-3">
              <Avatar size="sm" name={viewer.name} src={viewer.avatarUrl} />
              <Textarea
                id="prototype-comment"
                rows={3}
                placeholder="Ask a question or add something useful"
                aria-describedby="prototype-comment-hint"
              />
            </div>
            <p
              id="prototype-comment-hint"
              className="text-caption text-muted-foreground"
            >
              Comments are visible to everyone in Robotics Club.
            </p>
            <div className="flex justify-end">
              <Button type="button" size="lg">
                Comment
              </Button>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="comments-heading" className="flex flex-col">
          <h2 id="comments-heading" className="text-h3">
            {focusPostComments.length} comments
          </h2>
          <ul className="flex flex-col divide-y divide-border">
            {focusPostComments.map((comment) => (
              <li key={comment.id}>
                <CommentItem comment={comment} now={prototypeNow} />
              </li>
            ))}
          </ul>
          <Separator className="mt-2" />
          <p className="pt-4 text-caption text-muted-foreground">
            That is the whole thread. Real threads paginate at 20 comments.
          </p>
        </section>
      </div>
    </div>
  )
}
