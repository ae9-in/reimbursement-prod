import { useEffect, useState } from "react";
import { getGeneralClaims, updateGeneralClaim, GeneralClaimRecord } from "@/lib/api";
import { toast } from "sonner";
import { FileText, Clock, CheckCircle, XCircle, IndianRupee, RefreshCw, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const CATEGORIES = ['Medical', 'Training', 'Office Supplies', 'Internet/Phone', 'Other'];

export default function AdminGeneralClaims() {
  const [claims, setClaims] = useState<GeneralClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<GeneralClaimRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getGeneralClaims();
      setClaims(data);
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

  const handleStatusUpdate = async (id: string, newStatus: "Approved" | "Rejected") => {
    setUpdatingId(id);
    try {
      await updateGeneralClaim(id, { status: newStatus });
      toast.success(newStatus === "Approved" ? "Claim approved" : "Claim rejected");
      setClaims(prev =>
        prev.map(c => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openClaimDetail = (claim: GeneralClaimRecord) => {
    setSelectedClaim(claim);
    setDrawerOpen(true);
  };

  const filtered = claims.filter(c => {
    const matchesSearch = !searchQuery ||
      c.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.claim_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === "Pending").length;
  const approvedClaims = claims.filter(c => c.status === "Approved").length;
  const rejectedClaims = claims.filter(c => c.status === "Rejected").length;

  const metrics = [
    { label: "Total Claims", value: totalClaims, icon: FileText, color: "text-blue-500" },
    { label: "Pending", value: pendingClaims, icon: Clock, color: "text-amber-500" },
    { label: "Approved", value: approvedClaims, icon: CheckCircle, color: "text-green-500" },
    { label: "Rejected", value: rejectedClaims, icon: XCircle, color: "text-red-500" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      Pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
      Approved: { label: "Approved", className: "bg-green-100 text-green-700" },
      Rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    };
    const c = config[status] || config.Pending;
    return <Badge className={cn("text-xs", c.className)}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">General Claims</h1>
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Employee Name, Claim ID, or Department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No claims found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
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
                      onClick={() => openClaimDetail(claim)}
                    >
                      <TableCell className="font-medium text-xs">
                        {claim.claim_id}
                      </TableCell>
                      <TableCell>{claim.employee_name}</TableCell>
                      <TableCell>{claim.employee_code || "N/A"}</TableCell>
                      <TableCell>{claim.department}</TableCell>
                      <TableCell>{claim.category}</TableCell>
                      <TableCell className="font-medium">
                        ₹{claim.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(claim.date_of_expense).toLocaleDateString("en-IN")}
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
                        {getStatusBadge(claim.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {claim.status === "Pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleStatusUpdate(claim.id, "Approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleStatusUpdate(claim.id, "Rejected")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
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

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Claim Details</DrawerTitle>
          </DrawerHeader>
          {selectedClaim && (
            <div className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Claim ID</Label>
                  <p className="text-sm font-medium">{selectedClaim.claim_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedClaim.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employee Name</Label>
                  <p className="text-sm font-medium">{selectedClaim.employee_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employee Code</Label>
                  <p className="text-sm font-medium">{selectedClaim.employee_code || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="text-sm font-medium">{selectedClaim.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="text-sm font-medium">{selectedClaim.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-sm font-medium">₹{selectedClaim.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date of Expense</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedClaim.date_of_expense).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{selectedClaim.description}</p>
              </div>

              {selectedClaim.receipt_url && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Receipt</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-muted/20">
                      {selectedClaim.receipt_url.startsWith("data:") ||
                      selectedClaim.receipt_url.includes("base64") ? (
                        <img
                          src={selectedClaim.receipt_url}
                          alt="Receipt"
                          className="max-w-full h-auto max-h-[300px] object-contain"
                        />
                      ) : (
                        <a
                          href={selectedClaim.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-2"
                        >
                          <FileText className="h-5 w-5" />
                          View Receipt
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedClaim.status === "Pending" && (
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleStatusUpdate(selectedClaim.id, "Approved");
                      setDrawerOpen(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleStatusUpdate(selectedClaim.id, "Rejected");
                      setDrawerOpen(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}