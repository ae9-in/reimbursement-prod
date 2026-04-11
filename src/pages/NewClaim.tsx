import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPolicy, createClaim } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Upload } from "lucide-react";
import GpsTracker from "@/components/GpsTracker";

export default function NewClaim() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDistance = searchParams.get("distance") || "";
  
  const [dateOfTravel, setDateOfTravel] = useState(new Date().toISOString().split("T")[0]);
  const [purpose, setPurpose] = useState("");
  const [odometerStart, setOdometerStart] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [distanceKm, setDistanceKm] = useState(initialDistance);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [gpsData, setGpsData] = useState<any>(null);
  const [ratePerKm, setRatePerKm] = useState(8);
  const [saving, setSaving] = useState(false);
  const [showGps, setShowGps] = useState(false);

  useEffect(() => {
    getPolicy().then(policy => {
      if (policy) setRatePerKm(Number(policy.rate_per_km));
    });
  }, []);

  const odometerDistance = odometerStart && odometerEnd ? Number(odometerEnd) - Number(odometerStart) : null;
  const distance = Number(distanceKm) || 0;
  const amount = distance * ratePerKm;
  const odometerMismatch = odometerDistance !== null && distance > 0 && Math.abs(odometerDistance - distance) > 1;

  const handleGpsComplete = (data: { distance: number; route: [number, number][] }) => {
    setDistanceKm(data.distance.toFixed(1));
    setGpsData(data.route);
    setShowGps(false);
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!user) return;
    if (!dateOfTravel || !purpose || !distanceKm) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (new Date(dateOfTravel) > new Date()) {
      toast.error("Date of travel cannot be in the future");
      return;
    }
    setSaving(true);
    try {
      let receiptUrl: string | null = null;
      if (receiptFile) {
        // Mocking file upload
        receiptUrl = URL.createObjectURL(receiptFile);
      }

      await createClaim({
        employee_id: user.id,
        date_of_travel: dateOfTravel,
        distance_km: distance,
        purpose,
        odometer_start: odometerStart ? Number(odometerStart) : null,
        odometer_end: odometerEnd ? Number(odometerEnd) : null,
        status: asDraft ? "draft" : "submitted",
        amount_calculated: amount,
        receipt_url: receiptUrl,
        gps_route_data: gpsData,
      });

      toast.success(asDraft ? "Claim saved as draft" : "Claim submitted successfully");
      navigate("/claims");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Claim</h1>

      {showGps ? (
        <GpsTracker onComplete={handleGpsComplete} onCancel={() => setShowGps(false)} />
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date of Travel *</Label>
                  <Input id="date" type="date" value={dateOfTravel} onChange={(e) => setDateOfTravel(e.target.value)} max={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km) *</Label>
                  <Input id="distance" type="number" min="0" step="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Travel *</Label>
                <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Describe the purpose of your trip" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="odomStart">Odometer Start</Label>
                  <Input id="odomStart" type="number" value={odometerStart} onChange={(e) => setOdometerStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odomEnd">Odometer End</Label>
                  <Input id="odomEnd" type="number" value={odometerEnd} onChange={(e) => setOdometerEnd(e.target.value)} />
                </div>
              </div>
              {odometerMismatch && (
                <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Odometer difference ({odometerDistance} km) doesn't match the distance entered ({distance} km).</span>
                </div>
              )}
              <Button variant="outline" onClick={() => setShowGps(true)}>
                <MapPin className="mr-2 h-4 w-4" />GPS Trip Tracker
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Receipt Upload</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <Input type="file" accept="image/*,application/pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="max-w-xs mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Upload receipt image or PDF</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Estimated Amount</span>
                <span>₹{amount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">({distance} km × ₹{ratePerKm}/km)</span></span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => handleSubmit(true)} disabled={saving}>Save as Draft</Button>
            <Button onClick={() => handleSubmit(false)} disabled={saving}>{saving ? "Submitting..." : "Submit Claim"}</Button>
          </div>
        </>
      )}
    </div>
  );
}
