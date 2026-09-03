"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seatNumbersFor = seatNumbersFor;
function seatNumbersFor(booking) {
    if (!booking)
        return [];
    const seat = booking.seatNumber ?? booking.seat_number;
    return seat != null ? [seat] : [];
}
const seatSerializer = { seatNumbersFor };
exports.default = seatSerializer;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { seatNumbersFor };
    // @ts-ignore
    module.exports.seatNumbersFor = seatNumbersFor;
    // @ts-ignore
    module.exports.default = seatSerializer;
}
//# sourceMappingURL=seatSerializer.js.map