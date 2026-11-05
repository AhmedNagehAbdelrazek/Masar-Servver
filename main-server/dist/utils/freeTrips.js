"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasFreeTripsOffer = hasFreeTripsOffer;
exports.freeTripsLimit = freeTripsLimit;
const constants_1 = require("../config/constants");
function getFreeOffer(sub) {
    if (!sub)
        return null;
    const offer = sub.freeOffer ?? sub.free_offer;
    if (offer && typeof offer === 'object')
        return offer;
    return null;
}
function hasFreeTripsOffer(sub) {
    const offer = getFreeOffer(sub);
    return Boolean(offer && offer.type === constants_1.FREE_OFFER_TYPE.TRIPS);
}
function freeTripsLimit(sub) {
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
const freeTrips = { hasFreeTripsOffer, freeTripsLimit };
exports.default = freeTrips;
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
//# sourceMappingURL=freeTrips.js.map