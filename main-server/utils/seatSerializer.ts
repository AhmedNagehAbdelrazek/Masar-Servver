export interface BookingLike {
  seatNumber?: number | string | null;
  seat_number?: number | string | null;
  seatNumbers?: Array<number | string> | null;
  seat_numbers?: Array<number | string> | null;
}

export function seatNumbersFor(booking: BookingLike | null | undefined): (number | string)[] {
  if (!booking) return [];
  const rec = booking as Record<string, unknown>;
  const multi = rec.seatNumbers ?? rec.seat_numbers;
  if (Array.isArray(multi)) return multi as (number | string)[];
  const seat: unknown = rec.seatNumber ?? rec.seat_number;
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
