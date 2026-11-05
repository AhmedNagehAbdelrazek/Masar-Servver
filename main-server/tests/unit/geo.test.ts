import { describe, it, expect } from '@jest/globals';

const geo = require('../../Services/geo') as {
  haversineM: (a: number, b: number, c: number, d: number) => number;
  haversineKm: (a: number, b: number, c: number, d: number) => number;
  decode: (s: string) => number[][];
  encode: (p: number[][]) => string;
  distanceFromRouteM: (lat: number, lng: number, route: number[][]) => number;
  alongRouteM: (lat: number, lng: number, route: number[][]) => number;
  simplify: (p: number[][], t: number) => number[][];
};

// Amman -> Irbid corridor, same shape as the mapsClient mock.
const ROUTE: number[][] = [
  [31.9539, 35.9106],
  [32.25, 35.8793],
  [32.5568, 35.8469],
];

describe('geo utils', () => {
  it('haversine Amman->Irbid is a plausible drive distance', () => {
    const km = geo.haversineKm(31.9539, 35.9106, 32.5568, 35.8469);
    expect(km).toBeGreaterThan(50);
    expect(km).toBeLessThan(120);
  });

  it('encode/decode round-trips', () => {
    const back = geo.decode(geo.encode(ROUTE));
    expect(back).toHaveLength(3);
    expect(back[0][0]).toBeCloseTo(31.9539, 4);
    expect(back[2][1]).toBeCloseTo(35.8469, 4);
  });

  it('on-corridor point has ~zero distance, far point is rejected-scale', () => {
    expect(geo.distanceFromRouteM(32.25, 35.8793, ROUTE)).toBeLessThan(50);
    expect(geo.distanceFromRouteM(31.5, 35.5, ROUTE)).toBeGreaterThan(1500);
  });

  it('along-track position orders pickups south to north', () => {
    const a = geo.alongRouteM(31.96, 35.91, ROUTE);
    const b = geo.alongRouteM(32.55, 35.847, ROUTE);
    expect(a).toBeLessThan(b);
  });

  it('simplify collapses a straight line but keeps endpoints', () => {
    const line: number[][] = [
      [31.95, 35.91],
      [32.0, 35.9],
      [32.1, 35.89],
      [32.2, 35.88],
    ];
    const out = geo.simplify(line, 10);
    expect(out.length).toBeLessThan(line.length);
    expect(out[0]).toEqual(line[0]);
    expect(out[out.length - 1]).toEqual(line[line.length - 1]);
  });
});
