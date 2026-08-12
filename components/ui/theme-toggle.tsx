"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

/** Never changes after hydration, so the subscribe callback has nothing to do. */
const subscribe = () => () => {}

/**
 * True once the client has taken over, false during server rendering.
 *
 * The stored theme preference lives in localStorage, so the server cannot know
 * it and any markup that depends on it will mismatch. The usual fix is a
 * useState + useEffect pair, but that commits a render and then immediately
 * schedules another one on every mount. useSyncExternalStore states the same
 * fact declaratively, in one render, and satisfies the rule against calling
 * setState synchronously inside an effect.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

/**
 * Segmented theme control.
 *
 * Rendered as a radiogroup rather than a cycle button so the current theme is
 * always visible rather than inferred, and so screen readers can announce all
 * three choices. Nothing is marked as selected until hydrated, because the
 * server cannot know the stored preference.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()

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
        const checked = hydrated && theme === value
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
