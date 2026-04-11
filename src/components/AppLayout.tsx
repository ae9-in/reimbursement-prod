import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Outlet } from "react-router-dom";

const roleLabels = { employee: "Employee", manager: "Manager", admin: "Admin" };

export default function AppLayout() {
  const { profile, role } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs capitalize">{roleLabels[role]}</Badge>
              <span className="text-sm font-medium truncate max-w-[200px]">{profile?.full_name || profile?.email}</span>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
