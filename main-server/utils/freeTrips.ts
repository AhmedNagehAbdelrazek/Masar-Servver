import { FREE_OFFER_TYPE } from '../config/constants';

export interface FreeOffer {
  type?: string;
  value?: number | string;
  max?: number | string;
}

export interface SubscriptionLike {
  freeOffer?: FreeOffer | null;
  free_offer?: FreeOffer | null;
}

function getFreeOffer(sub: SubscriptionLike | null | undefined): FreeOffer | null {
  if (!sub) return null;
  const offer: unknown = (sub as Record<string, unknown>).freeOffer ?? (sub as Record<string, unknown>).free_offer;
  if (offer && typeof offer === 'object') return offer as FreeOffer;
  return null;
}

export function hasFreeTripsOffer(sub: SubscriptionLike | null | undefined): boolean {
  const offer = getFreeOffer(sub);
  return Boolean(offer && offer.type === FREE_OFFER_TYPE.TRIPS);
}

export function freeTripsLimit(sub: SubscriptionLike | null | undefined): number {
  if (!hasFreeTripsOffer(sub)) return 0;
  const offer = getFreeOffer(sub);
  if (!offer) return 0;
  const value: number = Number(offer.value);
  if (Number.isFinite(value) && value > 0) return value;
  return Number(offer.max) || 0;
}

const freeTrips = { hasFreeTripsOffer, freeTripsLimit };
export default freeTrips;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { hasFreeTripsOffer, freeTripsLimit };
  // @ts-ignore
  module.exports.hasFreeTripsOffer = hasFreeTripsOffer;
  // @ts-ignore
  module.exports.freeTripsLimit = freeTripsLimit;
  // @ts-ignore
  module.exports.default = freeTrips;
}
