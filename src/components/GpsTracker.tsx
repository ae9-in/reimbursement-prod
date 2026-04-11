import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Square, Play, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Polyline, useMap, Marker } from "react-leaflet";
import L from "leaflet";

// Create custom dot icon for live location
const liveLocationIcon = L.divIcon({
  html: `<div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapUpdater({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions.map(p => L.latLng(p[0], p[1]))).pad(0.1));
    }
  }, [positions, map]);
  return null;
}

interface GpsTrackerProps {
  onComplete: (data: { distance: number; route: [number, number][] }) => void;
  onCancel: () => void;
}

export default function GpsTracker({ onComplete, onCancel }: GpsTrackerProps) {
  const [tracking, setTracking] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setTracking(true);
    setHasData(true);
    if (positions.length === 0) {
      setDistance(0);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPositions((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const d = haversineDistance(last[0], last[1], newPos[0], newPos[1]);
            setDistance((prevDist) => prevDist + d);
          }
          return [...prev, newPos];
        });
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [positions.length]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  const handleReset = () => {
    setPositions([]);
    setDistance(0);
    setHasData(false);
    setTracking(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleFinish = () => {
    onComplete({ distance, route: positions });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const center: [number, number] = positions.length > 0 ? positions[positions.length - 1] : [20.5937, 78.9629];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />GPS Trip Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[300px] rounded-md overflow-hidden border">
          <MapContainer center={center} zoom={positions.length > 0 ? 15 : 5} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: "hsl(220, 70%, 50%)", weight: 4 }} />}
            {positions.length > 0 && <Marker position={positions[positions.length - 1]} icon={liveLocationIcon} />}
            <MapUpdater positions={positions} />
          </MapContainer>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Distance: <span className="font-semibold text-foreground">{distance.toFixed(1)} km</span>
            {" · "}Points: {positions.length}
          </div>
          <div className="flex gap-2">
            {!tracking && !hasData && (
              <Button onClick={startTracking}><Play className="mr-2 h-4 w-4" />Start Tracking</Button>
            )}
            
            {tracking && (
              <Button variant="destructive" onClick={stopTracking}><Square className="mr-2 h-4 w-4" />Stop Tracking</Button>
            )}

            {!tracking && hasData && (
              <>
                <Button variant="outline" onClick={handleReset}>Reset</Button>
                <Button variant="outline" onClick={startTracking}><Play className="mr-2 h-4 w-4" />Resume</Button>
                <Button onClick={handleFinish}>Use Distance</Button>
              </>
            )}
            
            {!tracking && !hasData && (
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
