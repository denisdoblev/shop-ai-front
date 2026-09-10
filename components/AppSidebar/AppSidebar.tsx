"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  BookMarked,
  Boxes,
  ChartNoAxesCombined,
  FolderCog,
  Grid2X2,
  History,
  Home,
  LayoutDashboard,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tags,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "./components/Logo"

const workspaceItems = [
  { label: "Home", url: "/", icon: Home },
  { label: "Explore", url: "/explore", icon: Search },
  { label: "Compare", url: "/compare", icon: ChartNoAxesCombined },
  { label: "AI Assistant", url: "/assistant", icon: Sparkles },
  { label: "Saved", url: "/saved", icon: BookMarked },
  { label: "History", url: "/history", icon: History },
]

const administrationItems = [
  { label: "Overview", url: "/admin", icon: LayoutDashboard },
  { label: "Products", url: "/admin/products", icon: Boxes },
  { label: "Brands", url: "/admin/brands", icon: Tags },
  { label: "Categories", url: "/admin/categories", icon: Grid2X2 },
  { label: "Attributes", url: "/admin/attributes", icon: SlidersHorizontal },
  { label: "Templates", url: "/admin/templates", icon: FolderCog },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="pt-6">
        <div className="flex items-center pl-2">
          <Logo />
          <span className="font-heading text-xl font-extrabold text-sidebar-foreground">Shop</span>
          <span className="font-heading text-xl font-extrabold text-primary">AI</span>
        </div>

      </SidebarHeader>
      <SidebarContent className="gap-7 px-2 pt-6">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-4 font-heading text-xs font-bold tracking-[0.12em] text-sidebar-foreground/60">
            Workspace
          </SidebarGroupLabel>
          <SidebarMenu>
            {workspaceItems.map(({ label, url, icon: Icon }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  render={<Link href={url} />}
                  isActive={pathname === url}
                  size="lg"
                  className="rounded-xl px-4 text-base font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground data-active:border-l-4 data-active:border-primary data-active:bg-sidebar-accent data-active:pl-3 data-active:text-sidebar-foreground"
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-4 font-heading text-xs font-bold tracking-[0.12em] text-sidebar-foreground/60">
            Administration
          </SidebarGroupLabel>
          <SidebarMenu>
            {administrationItems.map(({ label, url, icon: Icon }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  render={<Link href={url} />}
                  isActive={
                    pathname === url ||
                    (url !== "/admin" && pathname.startsWith(`${url}/`))
                  }
                  size="lg"
                  className="rounded-xl px-4 text-base font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground data-active:border-l-4 data-active:border-primary data-active:bg-sidebar-accent data-active:pl-3 data-active:text-sidebar-foreground"
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
