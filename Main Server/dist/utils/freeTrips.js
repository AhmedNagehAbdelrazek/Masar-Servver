"use strict";
const { FREE_OFFER_TYPE } = require('../config/constants');
function hasFreeTripsOffer(sub) {
    return Boolean(sub && sub.freeOffer && sub.freeOffer.type === FREE_OFFER_TYPE.TRIPS);
}
function freeTripsLimit(sub) {
    if (!hasFreeTripsOffer(sub))
        return 0;
    const value = Number(sub.freeOffer.value);
    if (Number.isFinite(value) && value > 0)
        return value;
    return Number(sub.freeOffer.max) || 0;
}
module.exports = { hasFreeTripsOffer, freeTripsLimit };
//# sourceMappingURL=freeTrips.js.map