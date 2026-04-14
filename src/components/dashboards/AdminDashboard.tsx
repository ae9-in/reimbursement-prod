import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClaims, getProfile, updateClaim } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { FileText, Clock, CheckCircle, IndianRupee, BarChart3, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    const data = await getClaims();
    setClaims(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateClaim(id, { status: newStatus as any });
      toast.success(`Claim ${newStatus === "rejected" ? "rejected" : newStatus === "paid" ? "marked as paid" : "approved"}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const filtered = statusFilter === "all" ? claims : claims.filter(c => c.status === statusFilter);
  const totalDisbursed = claims.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount_calculated), 0);
  const pending = claims.filter(c => ["submitted", "manager_approved"].includes(c.status)).length;
  const avgValue = claims.length ? claims.reduce((s, c) => s + Number(c.amount_calculated), 0) / claims.length : 0;

  const metrics = [
    { label: "Total Claims", value: claims.length, icon: FileText },
    { label: "Total Disbursed", value: `₹${totalDisbursed.toLocaleString()}`, icon: IndianRupee },
    { label: "Pending", value: pending, icon: Clock },
    { label: "Avg Claim Value", value: `₹${Math.round(avgValue).toLocaleString()}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
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
          <CardTitle>All Claims</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="manager_approved">Manager Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>
                      {claim.receipt_url ? (
                        <div className="flex items-center gap-1 text-primary hover:underline">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs">View</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={claim.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {(claim.status === "submitted" || claim.status === "manager_approved") && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(claim.id, "manager_approved")}
                          >
                            Approve
                          </Button>
                        )}
                        {claim.status === "manager_approved" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleStatusUpdate(claim.id, "paid")}
                          >
                            Paid
                          </Button>
                        )}
                        {(claim.status === "submitted" || claim.status === "manager_approved") && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(claim.id, "rejected")}
                          >
                            Reject
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => navigate(`/claims/${claim.id}`)}>
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
