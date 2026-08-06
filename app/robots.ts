import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/marketing/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth screens and the internal gallery carry no search value.
        disallow: ["/api/", "/design", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
