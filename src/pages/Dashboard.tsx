import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import EmployeeDashboard from "@/components/dashboards/EmployeeDashboard";
import ManagerDashboard from "@/components/dashboards/ManagerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

const Dashboard = () => {
  const { role } = useAuth();
  if (role === "manager") return <ManagerDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <EmployeeDashboard />;
};

export default Dashboard;
