export interface BookingLike {
  seatNumber?: number | string | null;
  seat_number?: number | string | null;
}

export function seatNumbersFor(booking: BookingLike | null | undefined): (number | string)[] {
  if (!booking) return [];
  const seat: unknown = (booking as Record<string, unknown>).seatNumber ?? (booking as Record<string, unknown>).seat_number;
  return seat != null ? [seat as number | string] : [];
}

const seatSerializer = { seatNumbersFor };
export default seatSerializer;

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
