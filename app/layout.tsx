import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type { ReactNode } from "react"

import { Providers } from "@/components/providers"
import { brand } from "@/lib/marketing/content"
import { siteUrl } from "@/lib/marketing/site"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const title = `${brand.name} — ${brand.tagline}`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  keywords: [
    "campus events",
    "student communities",
    "university clubs",
    "Chitkara University",
    "student opportunities",
  ],
  openGraph: {
    type: "website",
    siteName: brand.name,
    title,
    description: brand.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: brand.description,
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
