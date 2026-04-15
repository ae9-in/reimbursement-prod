import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  FileText,
  Clock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClaimStatus = "Pending" | "Approved" | "Rejected";

interface GeneralClaimRecord {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  status: ClaimStatus;
  submittedAt: string;
}

// History starts empty — only real submissions appear here

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  ClaimStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  Pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

function GeneralStatusBadge({ status }: { status: ClaimStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5",
        cfg.className
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORIES = [
  "Medical",
  "Training",
  "Office Supplies",
  "Internet/Phone",
  "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateClaimId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GCL-${new Date().getFullYear()}-${rand}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GeneralClaim() {
  const { user } = useAuth();

  // Form state
  const [employeeName, setEmployeeName] = useState(
    (user as any)?.name || (user as any)?.email?.split("@")[0] || ""
  );
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [dateOfExpense, setDateOfExpense] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [claimAmount, setClaimAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Confirmation dialog state
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  // Claims history (starts with mock data; new submissions prepend here)
  const [history, setHistory] = useState<GeneralClaimRecord[]>([]);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate() {
    const newErrors: Record<string, string> = {};

    if (!employeeName.trim()) newErrors.employeeName = "Employee name is required.";
    if (!department.trim()) newErrors.department = "Department is required.";
    if (!dateOfExpense) newErrors.dateOfExpense = "Date of expense is required.";
    else if (new Date(dateOfExpense) > new Date())
      newErrors.dateOfExpense = "Date cannot be in the future.";

    if (!claimAmount) {
      newErrors.claimAmount = "Claim amount is required.";
    } else if (isNaN(Number(claimAmount)) || Number(claimAmount) <= 0) {
      newErrors.claimAmount = "Enter a valid positive amount.";
    }

    if (!category) newErrors.category = "Please select a category.";
    if (!description.trim())
      newErrors.description = "Description / Justification is required.";
    else if (description.trim().length < 10)
      newErrors.description = "Please provide at least 10 characters.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setSubmitting(true);
    // Simulate async network call
    await new Promise((r) => setTimeout(r, 800));

    const newId = generateClaimId();
    const newRecord: GeneralClaimRecord = {
      id: newId,
      employeeName: employeeName.trim(),
      department: department.trim(),
      date: dateOfExpense,
      category,
      amount: Number(claimAmount),
      description: description.trim(),
      status: "Pending",
      submittedAt: new Date().toISOString().split("T")[0],
    };

    setHistory((prev) => [newRecord, ...prev]);
    setConfirmedId(newId);
    setSubmitting(false);

    // Reset form
    setEmployeeName(
      (user as any)?.name || (user as any)?.email?.split("@")[0] || ""
    );
    setEmployeeId("");
    setDepartment("");
    setDateOfExpense(new Date().toISOString().split("T")[0]);
    setClaimAmount("");
    setCategory("");
    setDescription("");
    setReceiptFile(null);
    setErrors({});
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">General Claims</h1>
          <p className="text-sm text-muted-foreground">
            Submit reimbursement claims for miscellaneous expenses.
          </p>
        </div>
      </div>

      {/* ── Submission Form ──────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Claim Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Row 1 — Employee Name + Employee ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gc-employee-name">
                  Employee Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gc-employee-name"
                  placeholder="e.g. Priya Sharma"
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    if (errors.employeeName)
                      setErrors((p) => ({ ...p, employeeName: "" }));
                  }}
                  className={errors.employeeName ? "border-destructive" : ""}
                />
                {errors.employeeName && (
                  <p className="text-xs text-destructive">{errors.employeeName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gc-employee-id">
                  Employee ID{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="gc-employee-id"
                  placeholder="e.g. EMP-1042"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2 — Department + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gc-department">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gc-department"
                  placeholder="e.g. Engineering"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    if (errors.department)
                      setErrors((p) => ({ ...p, department: "" }));
                  }}
                  className={errors.department ? "border-destructive" : ""}
                />
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gc-date">
                  Date of Expense <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="gc-date"
                  type="date"
                  value={dateOfExpense}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDateOfExpense(e.target.value);
                    if (errors.dateOfExpense)
                      setErrors((p) => ({ ...p, dateOfExpense: "" }));
                  }}
                  className={errors.dateOfExpense ? "border-destructive" : ""}
                />
                {errors.dateOfExpense && (
                  <p className="text-xs text-destructive">{errors.dateOfExpense}</p>
                )}
              </div>
            </div>

            {/* Row 3 — Amount + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gc-amount">
                  Claim Amount (INR) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gc-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={claimAmount}
                    onChange={(e) => {
                      setClaimAmount(e.target.value);
                      if (errors.claimAmount)
                        setErrors((p) => ({ ...p, claimAmount: "" }));
                    }}
                    className={cn("pl-9", errors.claimAmount ? "border-destructive" : "")}
                  />
                </div>
                {errors.claimAmount && (
                  <p className="text-xs text-destructive">{errors.claimAmount}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gc-category">
                  Expense Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    if (errors.category)
                      setErrors((p) => ({ ...p, category: "" }));
                  }}
                >
                  <SelectTrigger
                    id="gc-category"
                    className={errors.category ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Row 4 — Description */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-description">
                Description / Justification <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="gc-description"
                rows={4}
                placeholder="Provide a clear reason and justification for this expense claim…"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description)
                    setErrors((p) => ({ ...p, description: "" }));
                }}
                className={errors.description ? "border-destructive" : ""}
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <p className="text-xs text-destructive">{errors.description}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">{description.length} chars</p>
              </div>
            </div>

            {/* Row 5 — Receipt Upload */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-receipt">
                Attach Receipt{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  receiptFile
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
                onClick={() => document.getElementById("gc-receipt-input")?.click()}
              >
                <Upload
                  className={cn(
                    "h-8 w-8 transition-colors",
                    receiptFile ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {receiptFile ? (
                  <div className="text-sm">
                    <p className="font-medium text-primary">{receiptFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(receiptFile.size / 1024).toFixed(1)} KB — click to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, PDF up to 5 MB
                    </p>
                  </div>
                )}
                <input
                  id="gc-receipt-input"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end mt-4 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrors({});
              setClaimAmount("");
              setCategory("");
              setDescription("");
              setReceiptFile(null);
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={submitting} className="min-w-[130px]">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Submitting…
              </span>
            ) : (
              "Submit Claim"
            )}
          </Button>
        </div>
      </form>

      {/* ── Claims History Table ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ClipboardList className="h-4 w-4 text-primary" />
              Claims History
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {history.length} record{history.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No claims submitted yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Claims you submit will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wider">Claim ID</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Employee</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Department</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Category</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Amount (₹)</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((claim, idx) => (
                    <TableRow
                      key={claim.id}
                      className={cn(
                        "transition-colors hover:bg-muted/30",
                        idx === 0 && "bg-primary/5"
                      )}
                    >
                      <TableCell className="pl-6 font-mono text-xs font-medium text-primary">
                        {claim.id}
                      </TableCell>
                      <TableCell className="font-medium">{claim.employeeName}</TableCell>
                      <TableCell className="text-muted-foreground">{claim.department}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(claim.date)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {claim.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {claim.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <GeneralStatusBadge status={claim.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Success Confirmation Dialog ──────────────────────────────────── */}
      <Dialog open={!!confirmedId} onOpenChange={() => setConfirmedId(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">Claim Submitted</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Claim Submitted!</h2>
              <p className="text-sm text-muted-foreground">
                Your claim has been submitted successfully and is under review.
              </p>
            </div>
            <div className="w-full rounded-lg border bg-muted/50 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your Claim ID</p>
              <p className="font-mono text-lg font-bold text-primary">{confirmedId}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Save this ID for future reference. You can track your claim status in the history table below.
            </p>
            <Button className="w-full" onClick={() => setConfirmedId(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
