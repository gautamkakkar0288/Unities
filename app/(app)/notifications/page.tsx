import { Bell } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/features/shell/components/page-header"

export const metadata: Metadata = { title: "Notifications" }

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Reminders, registration updates, and community activity."
      />
      <EmptyState
        icon={Bell}
        title="You are all caught up"
        description="Notifications appear here once you register for events and join communities."
      />
    </>
  )
}
