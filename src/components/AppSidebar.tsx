import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FilePlus, FileText, Settings, BarChart3, LogOut, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { role, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const employeeItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "New Claim", url: "/claims/new", icon: FilePlus },
    { title: "General Claims", url: "/claims/general", icon: ClipboardList },
    { title: "My Claims", url: "/claims", icon: FileText },
  ];

  const managerItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Review Claims", url: "/claims", icon: FileText },
  ];

  const adminItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "All Claims", url: "/claims", icon: FileText },
    { title: "Policies", url: "/admin/policies", icon: Settings },
    { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  ];

  const items = role === "admin" ? adminItems : role === "manager" ? managerItems : employeeItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && "Reimbursement"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
