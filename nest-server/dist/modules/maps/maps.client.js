var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MapsClient_1;
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { getMapsConfig } from './maps.config.js';
const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const FIELD_MASK = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline';
const MOCK_CORRIDOR = [
    { lat: 31.9539, lng: 35.9106 },
    { lat: 32.25, lng: 35.8793 },
    { lat: 32.5568, lng: 35.8469 },
];
const MOCK_ROUTE = {
    polyline: '',
    distanceM: 95200,
    durationS: 5400,
    cached: false,
};
let mockPolylineCache = null;
async function mockPolyline() {
    if (!mockPolylineCache) {
        const mod = await import('@mapbox/polyline');
        mockPolylineCache = mod.default.encode(MOCK_CORRIDOR.map((p) => [p.lat, p.lng]));
    }
    return mockPolylineCache;
}
function mapsError(status, code, message) {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
}
let MapsClient = MapsClient_1 = class MapsClient {
    logger = new Logger(MapsClient_1.name);
    fetchCalls = { routes: 0, geocode: 0 };
    onModuleInit() {
        try {
            getMapsConfig();
        }
        catch (err) {
            this.logger.error(`Maps misconfigured: ${err?.message ?? err}. Set GOOGLE_MAPS_SERVER_API_KEY or keep MAPS_MOCK=true`);
            throw err;
        }
    }
    get mock() {
        return (process.env.MAPS_MOCK ?? 'true').toLowerCase() !== 'false';
    }
    get timeoutMs() {
        const n = Number(process.env.GOOGLE_MAPS_TIMEOUT_MS ?? 5000);
        return Number.isFinite(n) ? n : 5000;
    }
    get maxRetries() {
        const n = Number(process.env.GOOGLE_MAPS_MAX_RETRIES ?? 2);
        return Number.isFinite(n) ? n : 2;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async fetchJson(url, init, attemptLabel) {
        let lastErr = null;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);
            try {
                const res = await fetch(url, { ...init, signal: controller.signal });
                clearTimeout(timer);
                if (res.status === 429 || res.status === 403) {
                    throw mapsError(502, 'MAPS_QUOTA_EXCEEDED', `${attemptLabel} quota exceeded`);
                }
                if (!res.ok)
                    throw mapsError(502, 'MAPS_UNAVAILABLE', `${attemptLabel} failed: ${res.status}`);
                return (await res.json());
            }
            catch (err) {
                clearTimeout(timer);
                lastErr = err;
                if (err?.code === 'MAPS_QUOTA_EXCEEDED')
                    throw err;
                if (attempt < this.maxRetries)
                    await this.sleep(200 * (attempt + 1));
            }
        }
        const err = lastErr;
        if (err?.name === 'AbortError')
            throw mapsError(504, 'MAPS_TIMEOUT', `${attemptLabel} timed out`);
        throw mapsError(502, 'MAPS_UNAVAILABLE', `${attemptLabel} failed: ${err?.message ?? 'unknown'}`);
    }
    routeHash(points) {
        return createHash('sha1').update(JSON.stringify(points.map((p) => [p.lat, p.lng]))).digest('hex');
    }
    async computeRoutes({ origin, destination, intermediates = [], languageCode = 'ar', }) {
        if (this.mock) {
            return { ...MOCK_ROUTE, polyline: await mockPolyline() };
        }
        const key = process.env.GOOGLE_MAPS_SERVER_API_KEY ?? '';
        if (!key)
            throw mapsError(502, 'MAPS_UNAVAILABLE', 'missing server key');
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
        const json = (await this.fetchJson(ROUTES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': key,
                'X-Goog-FieldMask': FIELD_MASK,
            },
            body: JSON.stringify(body),
        }, 'routes'));
        const route = json.routes?.[0];
        if (!route?.polyline?.encodedPolyline)
            throw mapsError(502, 'MAPS_UNAVAILABLE', 'no route found');
        const durationS = route.duration ? parseInt(route.duration.replace('s', ''), 10) : 0;
        return {
            polyline: route.polyline.encodedPolyline,
            distanceM: route.distanceMeters ?? 0,
            durationS: Number.isFinite(durationS) ? durationS : 0,
            cached: false,
        };
    }
    async reverseGeocode({ lat, lng, languageCode = 'ar', }) {
        if (this.mock)
            return { city: 'Amman', area: '', label: 'Amman, Jordan' };
        const key = process.env.GOOGLE_MAPS_SERVER_API_KEY ?? '';
        if (!key)
            throw mapsError(502, 'MAPS_UNAVAILABLE', 'missing server key');
        this.fetchCalls.geocode += 1;
        const url = `${GEOCODE_URL}?latlng=${lat},${lng}&language=${encodeURIComponent(languageCode)}&key=${encodeURIComponent(key)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            const json = (await res.json());
            const first = json.results?.[0];
            if (!first)
                throw mapsError(502, 'MAPS_UNAVAILABLE', 'no geocode result');
            const comp = (type) => first.address_components?.find((c) => c.types.includes(type))?.long_name ?? '';
            return {
                city: comp('locality') || comp('administrative_area_level_1'),
                area: comp('sublocality') || comp('neighborhood'),
                label: first.formatted_address ?? '',
            };
        }
        catch (err) {
            clearTimeout(timer);
            if (err?.name === 'AbortError') {
                throw mapsError(504, 'MAPS_TIMEOUT', 'geocode timed out');
            }
            throw err;
        }
    }
};
MapsClient = MapsClient_1 = __decorate([
    Injectable()
], MapsClient);
export { MapsClient };
export { MOCK_CORRIDOR };
//# sourceMappingURL=maps.client.js.map