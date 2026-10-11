// Port of Main Server/utils/freeTrips.ts (verbatim logic).
export interface FreeOffer {
  type?: string;
  value?: number | string;
  max?: number | string;
}

export function getFreeOffer(sub: unknown): FreeOffer | null {
  if (!sub || typeof sub !== 'object') return null;
  const rec = sub as Record<string, unknown>;
  const offer = rec.freeOffer ?? rec.free_offer;
  if (offer && typeof offer === 'object') return offer as FreeOffer;
  return null;
}

export function hasFreeTripsOffer(sub: unknown): boolean {
  const offer = getFreeOffer(sub);
  return Boolean(offer && offer.type === 'trips');
}

export function freeTripsLimit(sub: unknown): number {
  if (!hasFreeTripsOffer(sub)) return 0;
  const offer = getFreeOffer(sub);
  if (!offer) return 0;
  const value = Number(offer.value);
  if (Number.isFinite(value) && value > 0) return value;
  return Number(offer.max) || 0;
}
