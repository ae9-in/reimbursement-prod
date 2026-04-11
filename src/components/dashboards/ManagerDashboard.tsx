import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClaims, getProfile } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { FileText, Clock, CheckCircle, IndianRupee, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await getClaims();
      const enriched = await Promise.all(data.map(async (c) => {
        const profile = await getProfile(c.employee_id);
        return { ...c, employee_profile: profile };
      }));
      setClaims(enriched);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  const filtered = statusFilter === "all" ? claims : claims.filter(c => c.status === statusFilter);
  const pending = claims.filter(c => c.status === "submitted").length;
  const approved = claims.filter(c => c.status === "manager_approved").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Review", value: pending, icon: Clock },
          { label: "Approved", value: approved, icon: CheckCircle },
          { label: "Total Claims", value: claims.length, icon: FileText },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{m.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Claims Queue</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="manager_approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No claims to review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((claim) => (
                    <TableRow key={claim.id} className="cursor-pointer" onClick={() => navigate(`/claims/${claim.id}`)}>
                      <TableCell>{claim.employee_profile?.full_name || "N/A"}</TableCell>
                      <TableCell>{new Date(claim.date_of_travel).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{claim.purpose}</TableCell>
                      <TableCell>{claim.distance_km} km</TableCell>
                      <TableCell>₹{Number(claim.amount_calculated).toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={claim.status} /></TableCell>
                      <TableCell><Button variant="ghost" size="sm">Review</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
