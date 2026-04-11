import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getClaim, getComments, addComment, updateClaim, getProfile } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, FileImage, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import L from "leaflet";

export default function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<any>(null);
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [claimData, commentsData] = await Promise.all([
      getClaim(id),
      getComments(id),
    ]);
    if (claimData) {
      setClaim(claimData);
      // Fetch employee profile
      const profile = await getProfile(claimData.employee_id);
      setEmployeeProfile(profile);
    }
    if (commentsData) {
      // Enrich comments with author names
      const enrichedComments = await Promise.all(commentsData.map(async (c) => {
        const profile = await getProfile(c.author_id);
        return { ...c, author_name: profile?.full_name || "Unknown" };
      }));
      setComments(enrichedComments);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === "rejected" && !newComment.trim()) {
      toast.error("Please add a comment explaining the rejection");
      return;
    }
    setActionLoading(true);
    try {
      await updateClaim(id!, { status: newStatus as any });
      if (newComment.trim()) {
        await addComment({ claim_id: id!, author_id: user!.id, comment: newComment });
        setNewComment("");
      }
      toast.success(`Claim ${newStatus === "rejected" ? "rejected" : newStatus === "paid" ? "marked as paid" : "approved"}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment({ claim_id: id!, author_id: user!.id, comment: newComment });
      setNewComment("");
      toast.success("Comment added");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (!claim) return <div className="text-center py-8 text-muted-foreground">Claim not found</div>;

  const gpsRoute = claim.gps_route_data as [number, number][] | null;
  const isReceipt = claim.receipt_url;
  const isPdf = isReceipt && claim.receipt_url.toLowerCase().endsWith(".pdf");
  const canApprove = role === "manager" && claim.status === "submitted";
  const canFinalApprove = role === "admin" && claim.status === "manager_approved";
  const canEdit = user?.id === claim.employee_id && claim.status === "draft";

  const statusTimeline = [
    { status: "draft", label: "Draft Created", date: claim.created_at },
    claim.status !== "draft" && { status: "submitted", label: "Submitted", date: claim.updated_at },
    claim.status === "manager_approved" && { status: "manager_approved", label: "Manager Approved", date: claim.updated_at },
    claim.status === "rejected" && { status: "rejected", label: "Rejected", date: claim.updated_at },
    claim.status === "paid" && { status: "paid", label: "Paid", date: claim.updated_at },
  ].filter(Boolean) as { status: string; label: string; date: string }[];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">Claim Detail</h1>
        <StatusBadge status={claim.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {employeeProfile && <div><span className="text-muted-foreground">Employee:</span> {employeeProfile.full_name}</div>}
            <div><span className="text-muted-foreground">Date:</span> {new Date(claim.date_of_travel).toLocaleDateString()}</div>
            <div><span className="text-muted-foreground">Purpose:</span> {claim.purpose}</div>
            <div><span className="text-muted-foreground">Distance:</span> {claim.distance_km} km</div>
            <div><span className="text-muted-foreground">Amount:</span> ₹{Number(claim.amount_calculated).toLocaleString()}</div>
            {claim.odometer_start != null && <div><span className="text-muted-foreground">Odometer:</span> {claim.odometer_start} → {claim.odometer_end}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusTimeline.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {isReceipt && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">{isPdf ? <FileText className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}Receipt</CardTitle></CardHeader>
          <CardContent>
            {isPdf ? (
              <iframe src={claim.receipt_url} className="w-full h-[400px] rounded border" />
            ) : (
              <img src={claim.receipt_url} alt="Receipt" className="max-h-[400px] rounded border object-contain" />
            )}
          </CardContent>
        </Card>
      )}

      {gpsRoute && gpsRoute.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" />GPS Route</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-md overflow-hidden border">
              <MapContainer bounds={L.latLngBounds(gpsRoute.map(p => L.latLng(p[0], p[1]))).pad(0.1)} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <Polyline positions={gpsRoute} pathOptions={{ color: "hsl(220, 70%, 50%)", weight: 4 }} />
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.author_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm">{c.comment}</p>
            </div>
          ))}
          <Separator />
          <div className="flex gap-2">
            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1" />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>Send</Button>
          </div>
        </CardContent>
      </Card>

      {(canApprove || canFinalApprove || canEdit) && (
        <Card>
          <CardContent className="pt-6 flex gap-3 justify-end">
            {canEdit && <Button onClick={() => navigate(`/claims/new`)}>Edit Claim</Button>}
            {canApprove && (
              <>
                <Button variant="destructive" onClick={() => handleStatusUpdate("rejected")} disabled={actionLoading}>Reject</Button>
                <Button onClick={() => handleStatusUpdate("manager_approved")} disabled={actionLoading}>Approve</Button>
              </>
            )}
            {canFinalApprove && (
              <>
                <Button variant="destructive" onClick={() => handleStatusUpdate("rejected")} disabled={actionLoading}>Reject</Button>
                <Button onClick={() => handleStatusUpdate("paid")} disabled={actionLoading}>Mark as Paid</Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
