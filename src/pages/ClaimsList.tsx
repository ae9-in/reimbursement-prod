import { useAuth } from "@/contexts/AuthContext";
import EmployeeDashboard from "@/components/dashboards/EmployeeDashboard";
import ManagerDashboard from "@/components/dashboards/ManagerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function ClaimsList() {
  const { role } = useAuth();
  // Reuse the dashboard components which show claims tables
  if (role === "admin") return <AdminDashboard />;
  if (role === "manager") return <ManagerDashboard />;
  return <EmployeeDashboard />;
}
