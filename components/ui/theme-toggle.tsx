"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

/**
 * Segmented theme control.
 *
 * Rendered as a radiogroup rather than a cycle button so the current theme is
 * always visible rather than inferred, and so screen readers can announce all
 * three choices. Mounts empty until hydrated to avoid a server/client mismatch
 * (the server cannot know the stored preference).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5",
        className,
      )}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const checked = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150",
              "hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              checked && "bg-secondary text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
