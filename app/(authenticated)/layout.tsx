import { cookies } from "next/headers";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { TopNavigation } from "@/components/TopNavigation/TopNavigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AuthenticatedLayout({
  children,
}: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <TopNavigation />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
