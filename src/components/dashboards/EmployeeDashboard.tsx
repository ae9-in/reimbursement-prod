import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getClaims } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { FileText, Clock, CheckCircle, IndianRupee, FilePlus, MapPin } from "lucide-react";
import GpsTracker from "@/components/GpsTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGps, setShowGps] = useState(false);

  useEffect(() => {
    if (!user) return;
    getClaims(user.id).then(data => {
      setClaims(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  const total = claims.length;
  const pending = claims.filter(c => ["submitted", "manager_approved"].includes(c.status)).length;
  const approved = claims.filter(c => c.status === "manager_approved" || c.status === "paid").length;
  const totalAmount = claims.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount_calculated), 0);

  const metrics = [
    { label: "Total Claims", value: total, icon: FileText },
    { label: "Pending", value: pending, icon: Clock },
    { label: "Approved", value: approved, icon: CheckCircle },
    { label: "Reimbursed", value: `₹${totalAmount.toLocaleString()}`, icon: IndianRupee },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowGps(true)}>
            <MapPin className="mr-2 h-4 w-4" />Start Trip
          </Button>
          <Button onClick={() => navigate("/claims/new")}><FilePlus className="mr-2 h-4 w-4" />New Claim</Button>
        </div>
      </div>

      {showGps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-background rounded-lg shadow-xl overflow-hidden">
            <GpsTracker 
              onComplete={(data) => {
                setShowGps(false);
                navigate(`/claims/new?distance=${data.distance.toFixed(1)}`);
              }} 
              onCancel={() => setShowGps(false)} 
            />
          </div>
        </div>
      )}
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
        <CardHeader><CardTitle>Recent Claims</CardTitle></CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No claims yet. Submit your first travel reimbursement claim!</p>
              <Button className="mt-4" onClick={() => navigate("/claims/new")}>Create Claim</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id} className="cursor-pointer" onClick={() => navigate(`/claims/${claim.id}`)}>
                      <TableCell>{new Date(claim.date_of_travel).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{claim.purpose}</TableCell>
                      <TableCell>{claim.distance_km} km</TableCell>
                      <TableCell>₹{Number(claim.amount_calculated).toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={claim.status} /></TableCell>
                      <TableCell><Button variant="ghost" size="sm">View</Button></TableCell>
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
