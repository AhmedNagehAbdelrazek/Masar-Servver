// Shared serializer for the passenger-facing trip payload. Mirrors
// Main Server/Services/homeService.ts `toTripDetails` so the passenger home,
// booking list and booking detail all expose the same complete trip shape.

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function serializeTripStops(
  stops: Record<string, unknown>[] | null | undefined,
): Record<string, unknown>[] {
  return [...(stops ?? [])]
    .sort((a, b) => Number(a.stopOrder ?? 0) - Number(b.stopOrder ?? 0))
    .map((s) => ({
      stop_id: s.id,
      stop_order: s.stopOrder,
      stop_name: s.stopName,
      city: s.city,
      address: s.address,
      lat: toNumberOrNull(s.lat ?? s.stopLat),
      lng: toNumberOrNull(s.lng ?? s.stopLng),
      stop_type: s.stopType,
      estimated_arrival: s.estimatedArrival,
    }));
}

export function serializeTripAttributes(
  attributes: Record<string, unknown>[] | null | undefined,
): { key: unknown; value: boolean }[] {
  return (attributes ?? []).map((a) => ({
    key: a.attrKey,
    value: a.attrValue === 'true',
  }));
}

export function serializeTripRoute(
  trip: Record<string, unknown>,
): Record<string, unknown> {
  return {
    status: (trip.routeStatus as string) || 'pending',
    version: Number(trip.routeVersion) || 0,
    polyline: trip.routePolyline ?? null,
    distance_m: toNumberOrNull(trip.routeDistanceM),
    duration_s: toNumberOrNull(trip.routeDurationS),
    computed_at: trip.routeComputedAt ?? null,
  };
}

export function serializePickupSection(
  booking: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: booking.pickupType ?? null,
    stop_id: booking.pickupStopId ?? null,
    place: booking.pickupPlace ?? null,
    label: booking.pickupLabel ?? null,
    city: booking.pickupCity ?? null,
    area: booking.pickupArea ?? null,
    lat: toNumberOrNull(booking.pickupLat),
    lng: toNumberOrNull(booking.pickupLng),
    order: booking.pickupOrder ?? null,
    status: booking.pickupStatus ?? 'pending',
    detour_seconds: toNumberOrNull(booking.detourSeconds),
    arrived_at: booking.arrivedAt ?? null,
    picked_up_at: booking.pickedUpAt ?? null,
  };
}

/** Every scalar trip field the passenger apps need, plus stops/attributes/route. */
export function serializeTripDetails(
  trip: Record<string, unknown>,
): Record<string, unknown> {
  const stops = (trip.stops as Record<string, unknown>[] | undefined) ?? [];
  return {
    trip_id: trip.id,
    origin: {
      city: trip.originCity,
      area: trip.originArea,
      address: trip.originAddress ?? null,
      lat: toNumberOrNull(trip.originLat),
      lng: toNumberOrNull(trip.originLng),
    },
    destination: {
      city: trip.destinationCity,
      area: trip.destinationArea,
      address: trip.destinationAddress ?? null,
      lat: toNumberOrNull(trip.destinationLat),
      lng: toNumberOrNull(trip.destinationLng),
    },
    departure_time: trip.departureTime,
    arrival_time: trip.arrivalTime ?? null,
    fare_per_seat: Number(trip.farePerSeat),
    total_profit: Number(trip.totalProfit) || 0,
    currency: (trip.currency as string) || 'JOD',
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    status: trip.status,
    is_recurring: Boolean(trip.isRecurring),
    recurrence_days: (trip.recurrenceDays as number[] | undefined) ?? [],
    recurrence_end_date: trip.recurrenceEndDate ?? null,
    gender_preference: (trip.genderPreference as string) || 'all',
    attributes: serializeTripAttributes(
      trip.attributes as Record<string, unknown>[] | undefined,
    ),
    stops: serializeTripStops(stops),
    waypoints: stops.map((s) => ({
      stop_name: s.stopName,
      stop_lat: toNumberOrNull(s.lat ?? s.stopLat),
      stop_lng: toNumberOrNull(s.lng ?? s.stopLng),
    })),
    instructions: (trip.driverInstructions as string[] | undefined) ?? [],
    additional_instructions: trip.additionalInstructions ?? null,
    created_at: trip.createdAt ?? null,
    route: serializeTripRoute(trip),
  };
}
