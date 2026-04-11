import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPolicy, updatePolicy } from "@/lib/api";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Policies() {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ratePerKm, setRatePerKm] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [maxMonthly, setMaxMonthly] = useState("");

  useEffect(() => {
    getPolicy().then(data => {
      if (data) {
        setPolicy(data);
        setRatePerKm(String(data.rate_per_km));
        setMaxDistance(String(data.max_distance_per_claim));
        setMaxMonthly(String(data.max_monthly_limit));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      await updatePolicy({
        rate_per_km: Number(ratePerKm),
        max_distance_per_claim: Number(maxDistance),
        max_monthly_limit: Number(maxMonthly),
        updated_by: user!.id,
      });
      toast.success("Policy settings updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" />Policy Configuration</h1>
      <Card>
        <CardHeader><CardTitle>Reimbursement Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rate per km (₹)</Label>
            <Input type="number" value={ratePerKm} onChange={(e) => setRatePerKm(e.target.value)} min="0" step="0.5" />
          </div>
          <div className="space-y-2">
            <Label>Max distance per claim (km)</Label>
            <Input type="number" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} min="0" />
          </div>
          <div className="space-y-2">
            <Label>Max monthly limit per employee (₹)</Label>
            <Input type="number" value={maxMonthly} onChange={(e) => setMaxMonthly(e.target.value)} min="0" />
          </div>
          {policy?.updated_at && (
            <p className="text-xs text-muted-foreground">Last updated: {new Date(policy.updated_at).toLocaleString()}</p>
          )}
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Settings"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
