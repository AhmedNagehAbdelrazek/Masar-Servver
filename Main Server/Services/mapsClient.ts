// @ts-nocheck
// : thin fetch wrapper. Timeout + 2 retries only — no circuit breaker,
// no SDK. Google call always happens OUTSIDE db transactions (callers own that).
import mapsConfig from '../config/maps';
import { ApiErrors } from '../utils/ApiError';
import { REDIS_KEYS } from '../utils/redisKeys';
import { incr } from '../config/redis';
import polyline from '@mapbox/polyline';

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const FIELD_MASK = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline';

// Deterministic mock (billing off): Amman -> Irbid corridor. The polyline is a
// real corridor segment so distance/projection math behaves in tests.
const MOCK_CORRIDOR = [
  [31.9539, 35.9106],
  [32.25, 35.8793],
  [32.5568, 35.8469],
];
const MOCK_ROUTE = {
  polyline: polyline.encode(MOCK_CORRIDOR),
  distanceM: 95200,
  durationS: 5400,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function count(api) {
  // : fire-and-forget usage counter — billing signal, never blocks/fails the call.
  try {
    const day = new Date().toISOString().slice(0, 10);
    incr(REDIS_KEYS.MAPS_USAGE(api, day)).catch(() => {});
  } catch {
    // redis offline — ignore
  }
}

function toApiError(err, status) {
  if (err && (err.name === 'AbortError' || /timeout/i.test(err.message || ''))) {
    return ApiErrors.custom('MAPS_TIMEOUT', 504, 'MAPS_TIMEOUT');
  }
  if (status === 429 || status === 403) {
    return ApiErrors.custom('MAPS_QUOTA_EXCEEDED', 502, 'MAPS_QUOTA_EXCEEDED');
  }
  return ApiErrors.custom('MAPS_UNAVAILABLE', 502, 'MAPS_UNAVAILABLE');
}

async function post(url, { body, key }) {
  const { timeoutMs, maxRetries } = mapsConfig;
  let lastErr = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      lastStatus = res.status;
      if (!res.ok) {
        lastErr = new Error(`routes http ${res.status}`);
        await sleep(200 * (attempt + 1));
        continue;
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      await sleep(200 * (attempt + 1));
    }
  }
  throw toApiError(lastErr, lastStatus);
}

async function computeRoutes({ origin, destination, intermediates = [], languageCode = 'ar' }) {
  if (mapsConfig.mock) {
    console.log('[mapsClient] maps.mock=true computeRoutes');
    return { ...MOCK_ROUTE };
  }
  if (!mapsConfig.serverApiKey) throw ApiErrors.custom('MAPS_UNAVAILABLE', 502, 'MAPS_UNAVAILABLE');
  count('routes');
  const toLatLng = (p) => ({ location: { latLng: { latitude: Number(p.lat), longitude: Number(p.lng) } } });
  const data = await post(ROUTES_URL, {
    key: mapsConfig.serverApiKey,
    body: {
      origin: toLatLng(origin),
      destination: toLatLng(destination),
      intermediates: intermediates.map(toLatLng),
      travelMode: 'DRIVE',
      languageCode,
      regionCode: mapsConfig.regionCode,
    },
  });
  const route = data && data.routes && data.routes[0];
  if (!route || !route.polyline || !route.polyline.encodedPolyline) {
    throw ApiErrors.custom('MAPS_UNAVAILABLE', 502, 'MAPS_UNAVAILABLE');
  }
  return {
    polyline: route.polyline.encodedPolyline,
    distanceM: Number(route.distanceMeters) || 0,
    durationS: parseInt(String(route.duration || '0s'), 10) || 0,
  };
}

async function reverseGeocode({ lat, lng, languageCode = 'ar' }) {
  if (mapsConfig.mock) return { city: 'Amman', area: '', label: 'Amman, Jordan' };
  if (!mapsConfig.serverApiKey) throw ApiErrors.custom('MAPS_UNAVAILABLE', 502, 'MAPS_UNAVAILABLE');
  count('geocoding');
  // : GET with params inline — the one Google call that isn't computeRoutes.
  const url =
    `${GEOCODE_URL}?latlng=${encodeURIComponent(lat + ',' + lng)}` +
    `&language=${encodeURIComponent(languageCode)}&key=${encodeURIComponent(mapsConfig.serverApiKey)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), mapsConfig.timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw toApiError(new Error(`geocode http ${res.status}`), res.status);
    const data = await res.json();
    const first = data && data.results && data.results[0];
    if (!first) throw ApiErrors.custom('MAPS_UNAVAILABLE', 502, 'MAPS_UNAVAILABLE');
    return { city: '', area: '', label: first.formatted_address || '' };
  } catch (err) {
    clearTimeout(timer);
    if (err && err.code) throw err;
    throw toApiError(err, 0);
  }
}

module.exports = { computeRoutes, reverseGeocode };
export { computeRoutes, reverseGeocode };
export default module.exports;
