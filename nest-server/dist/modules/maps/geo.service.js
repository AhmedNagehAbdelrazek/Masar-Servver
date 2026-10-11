var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import polyline from '@mapbox/polyline';
const R = 6371000;
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
let GeoService = class GeoService {
    haversineM(a, b) {
        const dLat = toRad(b[0] - a[0]);
        const dLng = toRad(b[1] - a[1]);
        const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
    }
    haversineKm(a, b) {
        return this.haversineM(a, b) / 1000;
    }
    decode(encoded) {
        return polyline.decode(encoded);
    }
    encode(points) {
        return polyline.encode(points);
    }
    segDistM(p, a, b) {
        const kx = Math.cos(toRad((a[0] + b[0]) / 2)) * 111320;
        const ky = 111320;
        const px = (p[1] - a[1]) * kx;
        const py = (p[0] - a[0]) * ky;
        const bx = (b[1] - a[1]) * kx;
        const by = (b[0] - a[0]) * ky;
        const segLen = Math.hypot(bx, by);
        if (segLen === 0)
            return { dist: Math.hypot(px, py), t: 0, segLen: 0 };
        const t = Math.max(0, Math.min(1, (px * bx + py * by) / (segLen * segLen)));
        return { dist: Math.hypot(px - t * bx, py - t * by), t, segLen };
    }
    distanceFromRouteM(point, route) {
        if (route.length === 0)
            return Number.POSITIVE_INFINITY;
        if (route.length === 1)
            return this.haversineM(point, route[0]);
        let best = Number.POSITIVE_INFINITY;
        for (let i = 0; i < route.length - 1; i++) {
            const { dist } = this.segDistM(point, route[i], route[i + 1]);
            if (dist < best)
                best = dist;
        }
        return best;
    }
    alongRouteM(point, route) {
        if (route.length < 2)
            return 0;
        let walked = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        let bestAlong = 0;
        for (let i = 0; i < route.length - 1; i++) {
            const { dist, t, segLen } = this.segDistM(point, route[i], route[i + 1]);
            if (dist < bestDist) {
                bestDist = dist;
                bestAlong = walked + t * segLen;
            }
            walked += segLen;
        }
        return bestAlong;
    }
    simplify(points, toleranceM) {
        if (points.length < 3)
            return [...points];
        const keep = new Array(points.length).fill(false);
        keep[0] = true;
        keep[points.length - 1] = true;
        const stack = [[0, points.length - 1]];
        while (stack.length > 0) {
            const [first, last] = stack.pop();
            let maxDist = 0;
            let maxIdx = -1;
            for (let i = first + 1; i < last; i++) {
                const { dist } = this.segDistM(points[i], points[first], points[last]);
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
};
GeoService = __decorate([
    Injectable()
], GeoService);
export { GeoService };
//# sourceMappingURL=geo.service.js.map