// : canned Google payloads + a one-call fetch stub. No MSW, no extra dep.
export const MAPS_FIXTURES = {
  routesSuccess: {
    routes: [
      {
        duration: '5400s',
        distanceMeters: 95200,
        // Amman -> Irbid shape (short, deterministic)
        polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' },
      },
    ],
  },
  routesFailure: { error: { code: 429, message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED' } },
  geocodeSuccess: {
    results: [{ formatted_address: 'Amman, Jordan', address_components: [] }],
    status: 'OK',
  },
  geocodeFailure: { results: [], status: 'ZERO_RESULTS' },
};

export function mockGoogleFetch(mode: 'success' | 'failure' | 'timeout' = 'success'): jest.SpyInstance {
  return jest.spyOn(global as unknown as { fetch: typeof fetch }, 'fetch').mockImplementation(async (url: unknown) => {
    const u = String(url);
    if (mode === 'timeout') throw new Error('fetch timeout');
    const body = u.includes('routes.googleapis.com') || (typeof url !== 'string')
      ? MAPS_FIXTURES.routesSuccess
      : MAPS_FIXTURES.geocodeSuccess;
    if (mode === 'failure') {
      return { ok: false, status: 429, json: async () => MAPS_FIXTURES.routesFailure } as unknown as Response;
    }
    return { ok: true, status: 200, json: async () => body } as unknown as Response;
  });
}
