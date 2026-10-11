export function getFreeOffer(sub) {
    if (!sub || typeof sub !== 'object')
        return null;
    const rec = sub;
    const offer = rec.freeOffer ?? rec.free_offer;
    if (offer && typeof offer === 'object')
        return offer;
    return null;
}
export function hasFreeTripsOffer(sub) {
    const offer = getFreeOffer(sub);
    return Boolean(offer && offer.type === 'trips');
}
export function freeTripsLimit(sub) {
    if (!hasFreeTripsOffer(sub))
        return 0;
    const offer = getFreeOffer(sub);
    if (!offer)
        return 0;
    const value = Number(offer.value);
    if (Number.isFinite(value) && value > 0)
        return value;
    return Number(offer.max) || 0;
}
//# sourceMappingURL=free-trips.js.map