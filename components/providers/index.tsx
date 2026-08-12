"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

import { QueryProvider } from "./query-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      // Light-first per docs/DESIGN/10-Theme-System.md: light is the default
      // for new visitors, while "system" remains selectable in the toggle.
      defaultTheme="light"
      enableSystem
      storageKey="cirqles-theme"
      disableTransitionOnChange
    >
      <QueryProvider>{children}</QueryProvider>
    </NextThemesProvider>
  )
}
