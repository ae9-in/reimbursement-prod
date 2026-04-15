import { useEffect, useState } from "react";
import { getClaims, getGeneralClaims, updateClaim, updateGeneralClaim, GeneralClaimRecord } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle, IndianRupee, TrendingUp, RefreshCw, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CombinedClaim {
  id: string;
  type: "travel" | "general";
  employee_name: string;
  employee_profile?: { full_name: string };
  date_of_travel?: string;
  date_of_expense?: string;
  purpose?: string;
  description?: string;
  category?: string;
  distance_km?: number;
  amount_calculated: number;
  amount?: number;
  status: string;
  receipt_url?: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<CombinedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [travelClaims, generalClaims] = await Promise.all([
        getClaims(),
        getGeneralClaims()
      ]);

      const combined: CombinedClaim[] = [
        ...travelClaims.map((c: any) => ({
          id: c.id,
          type: "travel" as const,
          employee_name: c.employee_profile?.full_name || "Unknown",
          employee_profile: c.employee_profile,
          date_of_travel: c.date_of_travel,
          purpose: c.purpose,
          distance_km: c.distance_km,
          amount_calculated: Number(c.amount_calculated),
          status: c.status,
          receipt_url: c.receipt_url,
          created_at: c.created_at
        })),
        ...generalClaims.map((c: GeneralClaimRecord) => ({
          id: c.id,
          type: "general" as const,
          employee_name: c.employee_name,
          date_of_expense: c.date_of_expense,
          description: c.description,
          category: c.category,
          amount_calculated: c.amount,
          status: c.status === "Pending" ? "submitted" : c.status === "Approved" ? "manager_approved" : "rejected",
          receipt_url: c.receipt_url,
          created_at: c.created_at
        }))
      ];

      setClaims(combined);
    } catch (err: any) {
      toast.error("Failed to load claims: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string, type: "travel" | "general") => {
    setUpdatingId(id);
    try {
      if (type === "travel") {
        await updateClaim(id, { status: newStatus as any });
      } else {
        const statusMap: Record<string, "Pending" | "Approved" | "Rejected"> = {
          submitted: "Pending",
          manager_approved: "Approved",
          rejected: "Rejected"
        };
        await updateGeneralClaim(id, { status: statusMap[newStatus] });
      }
      toast.success(
        newStatus === "rejected"
          ? "Claim rejected"
          : newStatus === "paid"
          ? "Claim marked as paid"
          : "Claim approved"
      );
      // Optimistic update — no full reload needed
      setClaims(prev =>
        prev.map(c => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = claims.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = c.employee_name?.toLowerCase().includes(q);
      const matchesPurpose = (c.purpose || c.description || "").toLowerCase().includes(q);
      const matchesCategory = c.category?.toLowerCase().includes(q);
      if (!matchesName && !matchesPurpose && !matchesCategory) return false;
    }
    return true;
  });

  const travelClaimsCount = claims.filter(c => c.type === "travel").length;
  const generalClaimsCount = claims.filter(c => c.type === "general").length;
  const totalDisbursed = claims
    .filter(c => c.status === "paid")
    .reduce((s, c) => s + c.amount_calculated, 0);
  const pending = claims.filter(c =>
    ["submitted", "manager_approved"].includes(c.status)
  ).length;
  const avgValue = claims.length
    ? claims.reduce((s, c) => s + c.amount_calculated, 0) / claims.length
    : 0;

  const metrics = [
    { label: "Travel Claims", value: travelClaimsCount, icon: FileText, color: "text-blue-500" },
    { label: "General Claims", value: generalClaimsCount, icon: Plus, color: "text-indigo-500" },
    { label: "Total Disbursed", value: `₹${totalDisbursed.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-500" },
    { label: "Pending Review", value: pending, icon: Clock, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards — shown immediately, skeleton while loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {m.label}
              </CardTitle>
              <m.icon className={cn("h-4 w-4", m.color)} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{m.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by employee name, purpose, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Claims</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
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
          {loading ? (
            /* Skeleton rows while loading */
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No claims found for the selected filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((claim) => (
                    <TableRow
                      key={claim.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        updatingId === claim.id && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => claim.type === "travel" ? navigate(`/claims/${claim.id}`) : navigate(`/general-claims/${claim.id}`)}
                    >
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          claim.type === "travel" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        )}>
                          {claim.type === "travel" ? "Travel" : "General"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {claim.employee_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(claim.date_of_travel || claim.date_of_expense || claim.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {claim.type === "travel" ? claim.purpose : claim.description || claim.category}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{claim.amount_calculated.toLocaleString()}
                      </TableCell>
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
                      <TableCell>
                        <StatusBadge status={claim.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(claim.status === "submitted" ||
                            claim.status === "manager_approved") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleStatusUpdate(claim.id, "manager_approved", claim.type)}
                            >
                              Approve
                            </Button>
                          )}
                          {claim.status === "manager_approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => handleStatusUpdate(claim.id, "paid", claim.type)}
                            >
                              Paid
                            </Button>
                          )}
                          {(claim.status === "submitted" ||
                            claim.status === "manager_approved") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleStatusUpdate(claim.id, "rejected", claim.type)}
                            >
                              Reject
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => claim.type === "travel" ? navigate(`/claims/${claim.id}`) : navigate(`/general-claims/${claim.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
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
