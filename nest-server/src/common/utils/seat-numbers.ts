// Port of Main Server/utils/seatSerializer.ts (verbatim).
export interface BookingLike {
  seatNumber?: number | string | null;
  seat_number?: number | string | null;
  seatNumbers?: (number | string)[] | null;
  seat_numbers?: (number | string)[] | null;
}

export function seatNumbersFor(booking: BookingLike | null | undefined): (number | string)[] {
  if (!booking) return [];
  const rec = booking as Record<string, unknown>;
  const multi = rec.seatNumbers ?? rec.seat_numbers;
  // NOTE: Prisma defaults seatNumbers to [] while Sequelize leaves it NULL;
  // an empty array falls through to the single seatNumber, matching Express.
  if (Array.isArray(multi) && multi.length > 0) return multi as (number | string)[];
  const seat: unknown = rec.seatNumber ?? rec.seat_number;
  return seat !== null && seat !== undefined ? [seat as number | string] : [];
}
