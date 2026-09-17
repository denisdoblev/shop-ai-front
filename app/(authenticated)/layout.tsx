import { cookies } from "next/headers";
import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { TopNavigation } from "@/components/TopNavigation/TopNavigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { CompareDock } from "./_components/CompareDock";
import { CompareProvider } from "./_providers/CompareProvider";

export default async function AuthenticatedLayout({
  children,
}: LayoutProps<"/">) {
  const [user, cookieStore] = await Promise.all([
    requireAuthenticatedUser(),
    cookies(),
  ]);
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <CompareProvider userId={user.id}>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <TopNavigation />
          {children}
        </SidebarInset>
        <CompareDock />
      </SidebarProvider>
    </CompareProvider>
  );
}
