export function seatNumbersFor(booking) {
    if (!booking)
        return [];
    const rec = booking;
    const multi = rec.seatNumbers ?? rec.seat_numbers;
    if (Array.isArray(multi) && multi.length > 0)
        return multi;
    const seat = rec.seatNumber ?? rec.seat_number;
    return seat !== null && seat !== undefined ? [seat] : [];
}
//# sourceMappingURL=seat-numbers.js.map