import { Injectable } from '@nestjs/common';
import polyline from '@mapbox/polyline';

// Port of Main Server/Services/geo.ts: haversine, polyline codec, segment
// projection, route distance/ordering, Douglas-Peucker simplify.
export type LatLng = [number, number];

const R = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

@Injectable()
export class GeoService {
  haversineM(a: LatLng, b: LatLng): number {
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  haversineKm(a: LatLng, b: LatLng): number {
    return this.haversineM(a, b) / 1000;
  }

  decode(encoded: string): LatLng[] {
    return polyline.decode(encoded) as LatLng[];
  }

  encode(points: LatLng[]): string {
    return polyline.encode(points);
  }

  private segDistM(p: LatLng, a: LatLng, b: LatLng): { dist: number; t: number; segLen: number } {
    const kx = Math.cos(toRad((a[0] + b[0]) / 2)) * 111320;
    const ky = 111320;
    const px = (p[1] - a[1]) * kx;
    const py = (p[0] - a[0]) * ky;
    const bx = (b[1] - a[1]) * kx;
    const by = (b[0] - a[0]) * ky;
    const segLen = Math.hypot(bx, by);
    if (segLen === 0) return { dist: Math.hypot(px, py), t: 0, segLen: 0 };
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / (segLen * segLen)));
    return { dist: Math.hypot(px - t * bx, py - t * by), t, segLen };
  }

  distanceFromRouteM(point: LatLng, route: LatLng[]): number {
    if (route.length === 0) return Number.POSITIVE_INFINITY;
    if (route.length === 1) return this.haversineM(point, route[0] as LatLng);
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < route.length - 1; i++) {
      const { dist } = this.segDistM(point, route[i] as LatLng, route[i + 1] as LatLng);
      if (dist < best) best = dist;
    }
    return best;
  }

  alongRouteM(point: LatLng, route: LatLng[]): number {
    if (route.length < 2) return 0;
    let walked = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    let bestAlong = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const { dist, t, segLen } = this.segDistM(point, route[i] as LatLng, route[i + 1] as LatLng);
      if (dist < bestDist) {
        bestDist = dist;
        bestAlong = walked + t * segLen;
      }
      walked += segLen;
    }
    return bestAlong;
  }

  simplify(points: LatLng[], toleranceM: number): LatLng[] {
    if (points.length < 3) return [...points];
    const keep = new Array<boolean>(points.length).fill(false);
    keep[0] = true;
    keep[points.length - 1] = true;
    const stack: [number, number][] = [[0, points.length - 1]];
    while (stack.length > 0) {
      const [first, last] = stack.pop() as [number, number];
      let maxDist = 0;
      let maxIdx = -1;
      for (let i = first + 1; i < last; i++) {
        const { dist } = this.segDistM(
          points[i] as LatLng,
          points[first] as LatLng,
          points[last] as LatLng,
        );
        if (dist > maxDist) {
          maxDist = dist;
          maxIdx = i;
        }
      }
      if (maxDist > toleranceM && maxIdx !== -1) {
        keep[maxIdx] = true;
        stack.push([first, maxIdx], [maxIdx, last]);
      }
    }
    return points.filter((_, i) => keep[i]);
  }
}
