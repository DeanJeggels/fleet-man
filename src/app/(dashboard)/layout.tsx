import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomTabs } from "@/components/layout/bottom-tabs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-20 lg:p-6 lg:pb-6">
            {children}
          </main>
          <BottomTabs />
        </div>
      </div>
    </SidebarProvider>
  );
}
