/**
 * Single source of the derived seat-numbers rule.
 * `bookings` stores a single `seat_number` plus a `seats_booked` count; there
 * is no `booking_seats` junction table. Returns `[seat_number]` when set,
 * otherwise `[]` (see specs/007-driver-home-api/research.md §2).
 */
function seatNumbersFor(booking) {
  return booking && booking.seatNumber != null ? [booking.seatNumber] : [];
}

module.exports = { seatNumbersFor };
