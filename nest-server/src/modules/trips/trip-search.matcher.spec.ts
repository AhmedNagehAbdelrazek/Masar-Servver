import { describe, expect, it } from 'vitest';
import { GeoService, type LatLng } from '../maps/geo.service.js';
import {
  matchTrip,
  mayBeNearRoute,
  normalizePlaceName,
  type SearchTrip,
  type TripSearchOptions,
} from './trip-search.matcher.js';

const geo = new GeoService();

// Amman -> Irbid mock corridor (same shape the MapsClient mock returns).
const CORRIDOR: LatLng[] = [
  [31.9539, 35.9106],
  [32.25, 35.8793],
  [32.5568, 35.8469],
];
const ROUTE = geo.encode(CORRIDOR);

function makeTrip(overrides: Partial<SearchTrip> = {}): SearchTrip {
  return {
    id: 'trip-1',
    originCity: 'Amman',
    originArea: 'Sweifieh',
    originLat: 31.9539,
    originLng: 35.9106,
    destinationCity: 'Irbid',
    destinationArea: null,
    destinationLat: 32.5568,
    destinationLng: 35.8469,
    routePolyline: ROUTE,
    routeStatus: 'ready',
    routeDistanceM: 95200,
    stops: [],
    ...overrides,
  };
}

function makeOptions(overrides: Partial<TripSearchOptions> = {}): TripSearchOptions {
  return {
    origin: { lat: 31.9539, lng: 35.9106 },
    destination: { lat: 32.5568, lng: 35.8469 },
    originCity: null,
    destinationCity: null,
    originRadiusM: 2000,
    destinationRadiusM: 2000,
    corridorM: 1500,
    includeEnroute: true,
    allowCustomDropoff: true,
    minRideM: 200,
    ...overrides,
  };
}

function offsetM(point: LatLng, meters: number): { lat: number; lng: number } {
  // ~111.32 km per degree of latitude.
  return { lat: point[0] + meters / 111320, lng: point[1] };
}

describe('matchTrip', () => {
  it('matches exact origin and destination', () => {
    const match = matchTrip(makeTrip(), makeOptions(), geo);
    expect(match).not.toBeNull();
    expect(match?.origin.kind).toBe('origin');
    expect(match?.destination.kind).toBe('destination');
    expect(match?.origin.distanceM).toBeCloseTo(0, 1);
    expect(match?.destination.distanceM).toBeCloseTo(0, 1);
    expect(match?.score).toBe(1);
  });

  it('matches a passenger 10 m from the trip origin', () => {
    const match = matchTrip(
      makeTrip(),
      makeOptions({ origin: offsetM(CORRIDOR[0] as LatLng, 10), includeEnroute: false }),
      geo,
    );
    expect(match).not.toBeNull();
    expect(match?.origin.kind).toBe('origin');
    expect(match?.origin.distanceM).toBeGreaterThan(5);
    expect(match?.origin.distanceM).toBeLessThan(20);
    expect(match?.score).toBeGreaterThan(0.99);
  });

  it('rejects a point outside the pickup radius', () => {
    const match = matchTrip(
      makeTrip(),
      makeOptions({ origin: offsetM(CORRIDOR[0] as LatLng, 2500), includeEnroute: false }),
      geo,
    );
    expect(match).toBeNull();
  });

  it('rejects the reverse direction (Irbid -> Amman)', () => {
    const match = matchTrip(
      makeTrip(),
      makeOptions({
        origin: { lat: 32.5568, lng: 35.8469 },
        destination: { lat: 31.9539, lng: 35.9106 },
      }),
      geo,
    );
    expect(match).toBeNull();
  });

  it('matches a pickup stop on the route', () => {
    const stopPoint = CORRIDOR[1] as LatLng;
    const trip = makeTrip({
      stops: [
        {
          id: 'stop-1',
          stopOrder: 1,
          stopName: 'Zarqa',
          city: 'Zarqa',
          lat: stopPoint[0],
          lng: stopPoint[1],
          stopLat: stopPoint[0],
          stopLng: stopPoint[1],
          stopType: 'both',
        },
      ],
    });
    const match = matchTrip(
      trip,
      makeOptions({ origin: { lat: stopPoint[0], lng: stopPoint[1] } }),
      geo,
    );
    expect(match).not.toBeNull();
    expect(match?.origin.kind).toBe('stop');
    expect(match?.origin.stopId).toBe('stop-1');
    expect(match?.origin.stopName).toBe('Zarqa');
  });

  it('does not use a dropoff-only stop as a pickup when enroute is disabled', () => {
    const stopPoint = CORRIDOR[1] as LatLng;
    const trip = makeTrip({
      stops: [
        {
          id: 'stop-1',
          stopOrder: 1,
          stopName: 'Zarqa',
          city: 'Zarqa',
          lat: stopPoint[0],
          lng: stopPoint[1],
          stopLat: stopPoint[0],
          stopLng: stopPoint[1],
          stopType: 'dropoff',
        },
      ],
    });
    const match = matchTrip(
      trip,
      makeOptions({
        origin: { lat: stopPoint[0], lng: stopPoint[1] },
        includeEnroute: false,
      }),
      geo,
    );
    expect(match).toBeNull();
  });

  it('matches an enroute pickup near the route', () => {
    const middle = { lat: 32.1, lng: 35.8886 };
    const match = matchTrip(makeTrip(), makeOptions({ origin: middle }), geo);
    expect(match).not.toBeNull();
    expect(match?.origin.kind).toBe('enroute');
    expect(match?.origin.distanceM).toBeLessThan(1500);
  });

  it('matches a short hop on a long route', () => {
    const match = matchTrip(
      makeTrip(),
      makeOptions({
        origin: { lat: 32.1, lng: 35.8886 },
        destination: { lat: 32.35, lng: 35.866 },
      }),
      geo,
    );
    expect(match).not.toBeNull();
    expect(match?.origin.kind).toBe('enroute');
    expect(match?.destination.kind).toBe('enroute');
  });

  it('falls back to endpoints/stops when no route is available', () => {
    const trip = makeTrip({ routePolyline: null, routeStatus: 'pending' });
    const exact = matchTrip(trip, makeOptions(), geo);
    expect(exact).not.toBeNull();
    expect(exact?.origin.kind).toBe('origin');

    const middle = matchTrip(
      trip,
      makeOptions({ origin: { lat: 32.1, lng: 35.8886 } }),
      geo,
    );
    expect(middle).toBeNull();
  });

  it('rejects a pickup at the destination end even when the dropoff is a city match', () => {
    const match = matchTrip(
      makeTrip(),
      makeOptions({
        origin: { lat: 32.5568, lng: 35.8469 },
        originCity: null,
        destination: null,
        destinationCity: 'Irbid',
      }),
      geo,
    );
    expect(match).toBeNull();
  });

  it('falls back to normalized city text when coordinates are missing', () => {
    const match = matchTrip(
      makeTrip(),
      makeOptions({
        origin: null,
        destination: null,
        originCity: '  AMMAN ',
        destinationCity: 'irbid',
      }),
      geo,
    );
    expect(match).not.toBeNull();
    expect(match?.origin.kind).toBe('city');
    expect(match?.destination.kind).toBe('city');

    const arabic = matchTrip(
      makeTrip({ originCity: 'عمّان', destinationCity: 'إربد' }),
      makeOptions({
        origin: null,
        destination: null,
        originCity: 'عمان',
        destinationCity: 'اربد',
      }),
      geo,
    );
    expect(arabic).not.toBeNull();
  });

  it('rejects a city mismatch', () => {
    const match = matchTrip(
      makeTrip(),
      makeOptions({
        origin: null,
        destination: null,
        originCity: 'Aqaba',
        destinationCity: 'Irbid',
      }),
      geo,
    );
    expect(match).toBeNull();
  });

  it('matches a stop city on the text fallback path', () => {
    const stopPoint = CORRIDOR[1] as LatLng;
    const trip = makeTrip({
      stops: [
        {
          id: 'stop-1',
          stopOrder: 1,
          stopName: 'Zarqa',
          city: 'Zarqa',
          lat: stopPoint[0],
          lng: stopPoint[1],
          stopLat: stopPoint[0],
          stopLng: stopPoint[1],
          stopType: 'pickup',
        },
      ],
    });
    const match = matchTrip(
      trip,
      makeOptions({ origin: null, originCity: 'Zarqa', destination: null, destinationCity: 'Irbid' }),
      geo,
    );
    expect(match).not.toBeNull();
    expect(match?.origin.kind).toBe('city');
    expect(match?.origin.stopId).toBe('stop-1');
  });
});

describe('mayBeNearRoute', () => {
  it('rejects a far point without decoding the route', () => {
    const far = { lat: 31.0, lng: 36.5 };
    expect(mayBeNearRoute(far, makeTrip(), 1500, geo)).toBe(false);
  });

  it('accepts an on-route point', () => {
    expect(mayBeNearRoute({ lat: 32.1, lng: 35.8886 }, makeTrip(), 1500, geo)).toBe(true);
  });
});

describe('normalizePlaceName', () => {
  it('normalizes case, punctuation, country suffixes and Arabic variants', () => {
    expect(normalizePlaceName('  Amman, Jordan ')).toBe('amman');
    expect(normalizePlaceName('IRBID')).toBe('irbid');
    expect(normalizePlaceName('عمّان')).toBe('عمان');
    expect(normalizePlaceName('إربد')).toBe('اربد');
    expect(normalizePlaceName(null)).toBe('');
  });
});
