import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, getCurrentPosition, getETA } from '@/lib/maps';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Clock } from 'lucide-react';

type Props = {
  technicianId: string;
  technicianName: string;
  destLat: number;
  destLng: number;
  bookingId?: string;
};

export function LiveTrackingMap({ technicianId, technicianName, destLat, destLng, bookingId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const techMarker = useRef<google.maps.Marker | null>(null);
  const destMarker = useRef<google.maps.Marker | null>(null);
  const [error, setError] = useState('');
  const [eta, setEta] = useState<{ distanceKm: number; etaMinutes: number } | null>(null);
  const [techPos, setTechPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let watchId: number | null = null;

    (async () => {
      try {
        await loadGoogleMaps();
        if (!mapRef.current || !window.google) return;

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: destLat, lng: destLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
        });

        destMarker.current = new window.google.maps.Marker({
          position: { lat: destLat, lng: destLng },
          map: mapInstance.current,
          label: 'Destination',
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        });

        // Subscribe to technician location updates
        const { subscribeToTechnicianLocation } = await import('@/lib/maps');
        unsubscribe = subscribeToTechnicianLocation(technicianId, (loc) => {
          setTechPos({ lat: loc.lat, lng: loc.lng });
          if (techMarker.current && mapInstance.current && window.google) {
            techMarker.current.setPosition({ lat: loc.lat, lng: loc.lng });
          } else if (window.google && mapInstance.current) {
            techMarker.current = new window.google.maps.Marker({
              position: { lat: loc.lat, lng: loc.lng },
              map: mapInstance.current,
              label: 'Tech',
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#16a34a', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
            });
          }
          const e = getETA(loc.lat, loc.lng, destLat, destLng);
          setEta(e);
        });

        // Try to get technician's current position (if this is the technician viewing)
        try {
          const pos = await getCurrentPosition();
          setTechPos(pos);
          if (window.google && mapInstance.current) {
            techMarker.current = new window.google.maps.Marker({
              position: pos,
              map: mapInstance.current,
              label: 'Tech',
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#16a34a', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
            });
          }
          const e = getETA(pos.lat, pos.lng, destLat, destLng);
          setEta(e);
        } catch { /* ignore - may not have permission */ }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
      }
    })();

    return () => { if (unsubscribe) unsubscribe(); if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [technicianId, destLat, destLng]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Google Maps API key is required for live tracking.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-900">{technicianName}</span>
          </div>
          {eta && (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-gray-600"><MapPin className="h-4 w-4" /> {eta.distanceKm} km</span>
              <span className="flex items-center gap-1 text-blue-600"><Clock className="h-4 w-4" /> {eta.etaMinutes} min ETA</span>
            </div>
          )}
        </div>
        <div ref={mapRef} className="w-full h-80 rounded-b-lg" />
        {!techPos && !eta && (
          <div className="p-4 text-center text-sm text-gray-500">
            Waiting for technician location updates...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
