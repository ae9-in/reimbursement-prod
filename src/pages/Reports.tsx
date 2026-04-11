import { useEffect, useState } from "react";
import { getClaims, getProfile } from "@/lib/api";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";

export default function Reports() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
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
  }, []);

  if (loading) return <DashboardSkeleton />;

  let filtered = claims;
  if (statusFilter !== "all") filtered = filtered.filter(c => c.status === statusFilter);
  if (dateFrom) filtered = filtered.filter(c => c.date_of_travel >= dateFrom);
  if (dateTo) filtered = filtered.filter(c => c.date_of_travel <= dateTo);

  const totalAmount = filtered.reduce((s, c) => s + Number(c.amount_calculated), 0);
  const totalDistance = filtered.reduce((s, c) => s + Number(c.distance_km), 0);

  const exportCsv = () => {
    const headers = ["Date", "Employee", "Department", "Purpose", "Distance (km)", "Amount (₹)", "Status"];
    const rows = filtered.map(c => [
      c.date_of_travel,
      c.employee_profile?.full_name || "",
      c.employee_profile?.department || "",
      c.purpose,
      c.distance_km,
      c.amount_calculated,
      c.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claims-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" />Reports</h1>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="manager_approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Claims</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Amount</p><p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Distance</p><p className="text-2xl font-bold">{totalDistance.toLocaleString()} km</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Claims Data</CardTitle>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.date_of_travel}</TableCell>
                    <TableCell>{c.employee_profile?.full_name || "N/A"}</TableCell>
                    <TableCell>{c.employee_profile?.department || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.purpose}</TableCell>
                    <TableCell>{c.distance_km} km</TableCell>
                    <TableCell>₹{Number(c.amount_calculated).toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
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
