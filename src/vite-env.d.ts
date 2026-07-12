/// <reference types="vite/client" />

declare namespace google {
  namespace maps {
    class Map { constructor(el: Element, opts?: object); setCenter(latLng: LatLng): void; setZoom(zoom: number): void; }
    class Marker { constructor(opts?: object); setPosition(latLng: LatLng): void; setMap(map: Map | null): void; }
    class LatLng { constructor(lat: number, lng: number); }
    const SymbolPath: { CIRCLE: number };
    class InfoWindow { constructor(opts?: object); }
    namespace places { class Autocomplete { constructor(input: HTMLInputElement, opts?: object); } }
    namespace geometry { namespace spherical { function computeDistanceBetween(a: LatLng, b: LatLng): number; } }
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_WHATSAPP_BOOKING: string;
  readonly VITE_WHATSAPP_SUPPORT: string;
  readonly VITE_PRIMARY_PHONE: string;
  readonly VITE_SUPPORT_PHONE: string;
  readonly VITE_UPI_ID: string;
  readonly VITE_UPI_PAYEE_NAME: string;
  readonly VITE_YOUTUBE_URL: string;
  readonly VITE_FACEBOOK_URL: string;
  readonly VITE_INSTAGRAM_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google?: typeof google;
}
