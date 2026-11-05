// @ts-nocheck
// : plain functions, no class. @mapbox/polyline does the codec;
// equirectangular approx is plenty for pickup-distance checks (no proj lib).
import polyline from '@mapbox/polyline';

const R = 6371000; // meters
const rad = (d) => (d * Math.PI) / 180;

function haversineM(lat1, lng1, lat2, lng2) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const haversineKm = (lat1, lng1, lat2, lng2) => haversineM(lat1, lng1, lat2, lng2) / 1000;

const decode = (encoded) => polyline.decode(encoded); // -> [[lat, lng], ...]
const encode = (points) => polyline.encode(points);

// Distance from point to segment AB (flat-earth, fine under a few km) + projection ratio.
function segDistM(p, a, b) {
  const kx = Math.cos(rad((a[0] + b[0]) / 2)) * 111320;
  const ky = 111320;
  const px = (p[1] - a[1]) * kx;
  const py = (p[0] - a[0]) * ky;
  const bx = (b[1] - a[1]) * kx;
  const by = (b[0] - a[0]) * ky;
  const len2 = bx * bx + by * by || 1;
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / len2));
  const dx = px - t * bx;
  const dy = py - t * by;
  return { dist: Math.sqrt(dx * dx + dy * dy), t };
}

function distanceFromRouteM(lat, lng, route) {
  let best = Infinity;
  for (let i = 0; i + 1 < route.length; i++) {
    const { dist } = segDistM([lat, lng], route[i], route[i + 1]);
    if (dist < best) best = dist;
  }
  return best;
}

// Meters along the route where the point projects — used to order pickups.
function alongRouteM(lat, lng, route) {
  let walked = 0;
  let bestAt = 0;
  let best = Infinity;
  for (let i = 0; i + 1 < route.length; i++) {
    const { dist, t } = segDistM([lat, lng], route[i], route[i + 1]);
    const segLen = haversineM(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
    if (dist < best) {
      best = dist;
      bestAt = walked + t * segLen;
    }
    walked += segLen;
  }
  return bestAt;
}

// Douglas-Peucker with tolerance in meters.
function simplify(points, toleranceM) {
  if (!points || points.length < 3) return points || [];
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const { dist } = segDistM(points[i], points[s], points[e]);
      if (dist > maxD) {
        maxD = dist;
        idx = i;
      }
    }
    if (maxD > toleranceM && idx > 0) {
      keep[idx] = true;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

module.exports = { haversineKm, haversineM, decode, encode, distanceFromRouteM, alongRouteM, simplify };
export { haversineKm, haversineM, decode, encode, distanceFromRouteM, alongRouteM, simplify };
export default module.exports;
