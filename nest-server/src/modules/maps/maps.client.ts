import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { getMapsConfig } from './maps.config.js';

// Port of Main Server/Services/mapsClient.ts: thin fetch wrapper over Google
// Routes + Geocoding with mock corridor, retries, timeouts and usage counts.
// MAPS_MOCK defaults true — no network until billing is enabled.
export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface ComputedRoute {
  polyline: string;
  distanceM: number;
  durationS: number;
  cached: boolean;
}

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const FIELD_MASK = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline';

// Amman → Irbid mock corridor (verbatim from mapsClient.ts).
const MOCK_CORRIDOR: RoutePoint[] = [
  { lat: 31.9539, lng: 35.9106 },
  { lat: 32.25, lng: 35.8793 },
  { lat: 32.5568, lng: 35.8469 },
];
const MOCK_ROUTE: ComputedRoute = {
  polyline: '',
  distanceM: 95200,
  durationS: 5400,
  cached: false,
};

let mockPolylineCache: string | null = null;

async function mockPolyline(): Promise<string> {
  if (!mockPolylineCache) {
    const mod = await import('@mapbox/polyline');
    mockPolylineCache = mod.default.encode(MOCK_CORRIDOR.map((p) => [p.lat, p.lng] as [number, number]));
  }
  return mockPolylineCache;
}

function mapsError(status: number, code: string, message: string): Error & { status?: number; code?: string } {
  const err = new Error(message) as Error & { status?: number; code?: string };
  err.status = status;
  err.code = code;
  return err;
}

@Injectable()
export class MapsClient implements OnModuleInit {
  private readonly logger = new Logger(MapsClient.name);
  readonly fetchCalls = { routes: 0, geocode: 0 };

  // Bootstrap-time validation: a missing GOOGLE_MAPS_SERVER_API_KEY with
  // MAPS_MOCK=false crashes startup (with Logger context) instead of failing
  // the first route call inside getMapsConfig().
  onModuleInit(): void {
    try {
      getMapsConfig();
    } catch (err) {
      this.logger.error(
        `Maps misconfigured: ${(err as Error)?.message ?? err}. Set GOOGLE_MAPS_SERVER_API_KEY or keep MAPS_MOCK=true`,
      );
      throw err;
    }
  }

  private get mock(): boolean {
    return (process.env.MAPS_MOCK ?? 'true').toLowerCase() !== 'false';
  }

  private get timeoutMs(): number {
    const n = Number(process.env.GOOGLE_MAPS_TIMEOUT_MS ?? 5000);
    return Number.isFinite(n) ? n : 5000;
  }

  private get maxRetries(): number {
    const n = Number(process.env.GOOGLE_MAPS_MAX_RETRIES ?? 2);
    return Number.isFinite(n) ? n : 2;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchJson(url: string, init: RequestInit, attemptLabel: string): Promise<unknown> {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);
        if (res.status === 429 || res.status === 403) {
          throw mapsError(502, 'MAPS_QUOTA_EXCEEDED', `${attemptLabel} quota exceeded`);
        }
        if (!res.ok) throw mapsError(502, 'MAPS_UNAVAILABLE', `${attemptLabel} failed: ${res.status}`);
        return (await res.json()) as unknown;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        if ((err as { code?: string })?.code === 'MAPS_QUOTA_EXCEEDED') throw err;
        if (attempt < this.maxRetries) await this.sleep(200 * (attempt + 1));
      }
    }
    const err = lastErr as { name?: string; code?: string; message?: string };
    if (err?.name === 'AbortError') throw mapsError(504, 'MAPS_TIMEOUT', `${attemptLabel} timed out`);
    throw mapsError(502, 'MAPS_UNAVAILABLE', `${attemptLabel} failed: ${err?.message ?? 'unknown'}`);
  }

  routeHash(points: RoutePoint[]): string {
    return createHash('sha1').update(JSON.stringify(points.map((p) => [p.lat, p.lng]))).digest('hex');
  }

  async computeRoutes({
    origin,
    destination,
    intermediates = [],
    languageCode = 'ar',
  }: {
    origin: RoutePoint;
    destination: RoutePoint;
    intermediates?: RoutePoint[];
    languageCode?: string;
  }): Promise<ComputedRoute> {
    if (this.mock) {
      return { ...MOCK_ROUTE, polyline: await mockPolyline() };
    }
    const key = process.env.GOOGLE_MAPS_SERVER_API_KEY ?? '';
    if (!key) throw mapsError(502, 'MAPS_UNAVAILABLE', 'missing server key');
    this.fetchCalls.routes += 1;
    const regionCode = process.env.GOOGLE_MAPS_REGION_CODE ?? 'jo';
    const body = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      intermediates: intermediates.map((p) => ({
        location: { latLng: { latitude: p.lat, longitude: p.lng } },
      })),
      travelMode: 'DRIVE',
      languageCode,
      regionCode,
    };
    const json = (await this.fetchJson(
      ROUTES_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
      },
      'routes',
    )) as { routes?: { duration?: string; distanceMeters?: number; polyline?: { encodedPolyline?: string } }[] };
    const route = json.routes?.[0];
    if (!route?.polyline?.encodedPolyline) throw mapsError(502, 'MAPS_UNAVAILABLE', 'no route found');
    const durationS = route.duration ? parseInt(route.duration.replace('s', ''), 10) : 0;
    return {
      polyline: route.polyline.encodedPolyline,
      distanceM: route.distanceMeters ?? 0,
      durationS: Number.isFinite(durationS) ? durationS : 0,
      cached: false,
    };
  }

  async reverseGeocode({
    lat,
    lng,
    languageCode = 'ar',
  }: {
    lat: number;
    lng: number;
    languageCode?: string;
  }): Promise<{ city: string; area: string; label: string }> {
    if (this.mock) return { city: 'Amman', area: '', label: 'Amman, Jordan' };
    const key = process.env.GOOGLE_MAPS_SERVER_API_KEY ?? '';
    if (!key) throw mapsError(502, 'MAPS_UNAVAILABLE', 'missing server key');
    this.fetchCalls.geocode += 1;
    const url = `${GEOCODE_URL}?latlng=${lat},${lng}&language=${encodeURIComponent(languageCode)}&key=${encodeURIComponent(key)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const json = (await res.json()) as {
        results?: { formatted_address?: string; address_components?: { long_name: string; types: string[] }[] }[];
      };
      const first = json.results?.[0];
      if (!first) throw mapsError(502, 'MAPS_UNAVAILABLE', 'no geocode result');
      const comp = (type: string): string =>
        first.address_components?.find((c) => c.types.includes(type))?.long_name ?? '';
      return {
        city: comp('locality') || comp('administrative_area_level_1'),
        area: comp('sublocality') || comp('neighborhood'),
        label: first.formatted_address ?? '',
      };
    } catch (err) {
      clearTimeout(timer);
      if ((err as { name?: string })?.name === 'AbortError') {
        throw mapsError(504, 'MAPS_TIMEOUT', 'geocode timed out');
      }
      throw err;
    }
  }
}

export { MOCK_CORRIDOR };
