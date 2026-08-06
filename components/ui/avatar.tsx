import { cva, type VariantProps } from "class-variance-authority"
import Image from "next/image"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-[0.625rem]",
        sm: "size-8 text-caption",
        md: "size-10 text-body-sm",
        lg: "size-14 text-h4",
        xl: "size-20 text-h3",
      },
    },
    defaultVariants: { size: "md" },
  },
)

const sizePx = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 } as const

/** First letters of the first and last word, e.g. "Gautam Kakkar" -> "GK". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  const first = words[0]?.[0] ?? ""
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : ""
  return (first + last).toUpperCase()
}

type AvatarProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof avatarVariants> & {
    /** Used for the image alt text and to derive the initials fallback. */
    name: string
    src?: string | null
  }

/**
 * Avatar with a deterministic initials fallback, so a missing image never
 * leaves an empty circle. Decorative when it sits beside the person's name,
 * hence the empty alt — the adjacent label carries the meaning.
 */
function Avatar({ className, size = "md", name, src, ...props }: AvatarProps) {
  const dimension = sizePx[size ?? "md"]

  return (
    <span
      data-slot="avatar"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={dimension}
          height={dimension}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
      {!src && <span className="sr-only">{name}</span>}
    </span>
  )
}

export { Avatar, avatarVariants }
