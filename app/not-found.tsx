import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        This page doesn&apos;t exist
      </h1>
      <p className="max-w-md text-muted-foreground">
        The page you are looking for may have moved or never existed.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to home
      </Link>
    </main>
  )
}
