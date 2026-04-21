import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { FleetProvider } from "@/contexts/fleet-context";
import { QueryProvider } from "@/components/providers/query-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <FleetProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            {/* min-w-0 is load-bearing: without it, flex children whose
                contents exceed the flex share (e.g. wide tab lists) will
                burst the column past the viewport instead of scrolling. */}
            <div className="flex flex-1 flex-col min-w-0">
              <Topbar />
              <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 pb-20 lg:p-6 lg:pb-6">
                {children}
              </main>
              <BottomTabs />
            </div>
          </div>
        </SidebarProvider>
      </FleetProvider>
    </QueryProvider>
  );
}
