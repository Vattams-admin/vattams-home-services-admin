import { GOOGLE_MAPS_API_KEY } from '@/lib/constants';
import { haversineDistance, calculateETA } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { TechnicianLocation } from '@/lib/supabase';

let mapsLoaded = false;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (mapsLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key not configured'));
  }
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => { mapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function updateTechnicianLocation(technicianId: string, lat: number, lng: number, bookingId?: string) {
  try {
    if (bookingId) {
      const { data: existing } = await supabase
        .from('technician_locations')
        .select('id')
        .eq('technician_id', technicianId)
        .eq('booking_id', bookingId)
        .maybeSingle();
      if (existing) {
        await supabase.from('technician_locations')
          .update({ lat, lng, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        return;
      }
    }
    await supabase.from('technician_locations').insert({
      technician_id: technicianId,
      booking_id: bookingId || null,
      lat, lng,
    });
  } catch (err) { console.error('Failed to update location:', err); }
}

export async function getTechnicianLocation(technicianId: string): Promise<TechnicianLocation | null> {
  try {
    const { data, error } = await supabase
      .from('technician_locations')
      .select('*')
      .eq('technician_id', technicianId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data as TechnicianLocation | null;
  } catch { return null; }
}

export function subscribeToTechnicianLocation(technicianId: string, callback: (loc: TechnicianLocation) => void) {
  const channel = supabase
    .channel(`technician-location-${technicianId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'technician_locations', filter: `technician_id=eq.${technicianId}` },
      (payload) => callback(payload.new as TechnicianLocation)
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function getETA(techLat: number, techLng: number, destLat: number, destLng: number): { distanceKm: number; etaMinutes: number } {
  const distanceKm = haversineDistance(techLat, techLng, destLat, destLng);
  const etaMinutes = calculateETA(distanceKm);
  return { distanceKm: Math.round(distanceKm * 10) / 10, etaMinutes };
}

export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function openInGoogleMaps(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}
