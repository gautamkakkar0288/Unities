import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/marketing/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth screens, the internal gallery, and the fixture prototype carry
        // no search value - and the prototype is fabricated data that must
        // never surface in a search result about Cirqles.
        disallow: ["/api/", "/design", "/prototype", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
