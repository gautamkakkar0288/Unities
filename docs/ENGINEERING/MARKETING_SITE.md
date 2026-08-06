# Marketing Site

The public site at `/`. Its job is narrow: take a visitor who has heard the name "Cirqles" from a friend and get them to a created account, while establishing the trust-first positioning from `PRD.md` §3 before they ever sign in.

## Structure

| Location | Role |
|---|---|
| `app/(marketing)/layout.tsx` | skip link, header, footer |
| `app/(marketing)/page.tsx` | section composition and structured data |
| `lib/marketing/content.ts` | all copy, as typed data (D17) |
| `lib/marketing/site.ts` | absolute site origin for metadata, robots, sitemap |
| `features/marketing/components/*` | section components |
| `components/brand/logo.tsx` | logo mark and wordmark |

## Page narrative

The section order is an argument, not a list of blocks:

1. **Hero** — the promise, in one line a student would say out loud.
2. **Problem** — name the pain in their words, from `PRD.md` §4. Nobody buys a solution to a problem they have not recognised.
3. **Features** — what you get, framed as outcomes rather than nouns.
4. **How it works** — remove the "is this a lot of effort?" objection. Three steps, one minute.
5. **For organisers / For universities** — the two audiences who make the platform worth joining. Students only get value if these two show up.
6. **FAQ** — handle the remaining objections, including cost and privacy.
7. **Final CTA** — ask once more, cleanly.

## Rules

- **Copy edits go in `lib/marketing/content.ts`.** Never inline a string in a section component.
- **Sections use the shared `Section` shell** so vertical rhythm stays identical down the page. Inconsistent section gaps are the fastest way a landing page starts looking amateur.
- **No invented numbers.** See D16.
- **Server components by default.** Only `SiteHeader` (mobile menu state) and `ThemeToggle` are client components.
- **Every in-page nav anchor must resolve to a rendered section id.** A test enforces this, because broken anchor links are invisible in code review.

## SEO

- `metadataBase` is set from `NEXT_PUBLIC_APP_URL`, falling back to localhost so builds never require the variable.
- OpenGraph and Twitter card metadata are derived from the same `brand` object the page renders.
- `Organization` and `FAQPage` JSON-LD are generated from the content module, so schema cannot drift from visible copy.
- `robots.ts` disallows `/api/`, `/design`, `/sign-in`, and `/sign-up` — none carry search value.
- `sitemap.ts` currently lists the landing page only. Add public community and event pages as they ship.

## Known gaps

- **No OG image yet.** `twitter:card` is declared as `summary_large_image` but no asset exists, so link previews will show text only. Needs a designed 1200x630 image, or a generated one via `next/og`, before launch.
- **Anchor-only navigation.** Everything is one page. Standalone `/for-organisers` and `/for-universities` routes are worth adding when there is enough to say and enough traffic to justify them.
- **No analytics.** `docs/UX/06-Analytics.md` defines the event taxonomy; instrumentation is a Phase 15 concern, but landing conversion is the first funnel worth measuring.
- **Legal pages missing.** Privacy policy and terms are required before a public launch and are referenced by no footer link yet.
