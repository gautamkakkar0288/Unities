import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { brand, footerSections } from "@/lib/marketing/content"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-xs flex-col gap-3">
            <Logo />
            <p className="text-body-sm text-muted-foreground">
              {brand.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-3">
                <h2 className="text-caption font-semibold tracking-wide text-foreground uppercase">
                  {section.title}
                </h2>
                <ul className="flex flex-col gap-2">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.href}`}>
                      <Link
                        href={link.href}
                        className="rounded-md text-body-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted-foreground">
            &copy; {new Date().getFullYear()} {brand.name}. Built for students.
          </p>
          <a
            href={`mailto:${brand.email}`}
            className="rounded-md text-caption text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {brand.email}
          </a>
        </div>
      </div>
    </footer>
  )
}
