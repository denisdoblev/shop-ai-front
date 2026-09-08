import { Bell, CircleUserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function TopNavigation() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6">
      <SidebarTrigger />
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Notificaciones">
          <Bell />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Perfil de usuario">
          <CircleUserRound />
        </Button>
      </div>
    </header>
  )
}
