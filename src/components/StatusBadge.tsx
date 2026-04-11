import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClaimStatus = "draft" | "submitted" | "manager_approved" | "rejected" | "paid";

const statusConfig: Record<ClaimStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", className: "bg-info text-info-foreground" },
  manager_approved: { label: "Approved", className: "bg-success text-success-foreground" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground" },
  paid: { label: "Paid", className: "bg-teal text-teal-foreground" },
};

export const StatusBadge = ({ status }: { status: ClaimStatus }) => {
  const config = statusConfig[status] || statusConfig.draft;
  return <Badge className={cn("text-xs", config.className)}>{config.label}</Badge>;
};
