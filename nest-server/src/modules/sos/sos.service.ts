import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RealtimeGateway as RealtimeGatewayToken } from '../../realtime/realtime.gateway.js';
import { RealtimeMetricsService } from '../../realtime/realtime-metrics.service.js';

export interface SosUser {
  id: string;
  role: string;
}

const ACTIVE_SOS_STATUSES = ['pending', 'acknowledged'];
const ACTIVE_TRIP_STATUSES = ['in_progress', 'ongoing'];
export const RE_ALERT_INTERVAL_MS = 60 * 1000;
export const ESCALATION_AFTER_MS = 5 * 60 * 1000;

const SOS_STATUSES = ['pending', 'acknowledged', 'resolved', 'cancelled'] as const;

interface SosRow {
  id: string;
  userId: string;
  tripId: string;
  bookingId: string | null;
  lat: unknown;
  lng: unknown;
  urgency: string;
  escalationLevel: number;
  status: string;
  createdAt: Date | null;
  user?: { fullName: string | null } | null;
}

function serialize(event: SosRow, user: { fullName: string | null } | null = null): Record<string, unknown> {
  return {
    id: event.id,
    user_id: event.userId,
    user_name: user ? user.fullName : null,
    trip_id: event.tripId,
    booking_id: event.bookingId || null,
    lat: Number(event.lat),
    lng: Number(event.lng),
    urgency: event.urgency,
    escalation_level: event.escalationLevel,
    status: event.status,
    triggered_at: event.createdAt ? event.createdAt.toISOString() : null,
  };
}

function validationError(message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({ message, code: 'VALIDATION_FAILED' });
}

// Port of Main Server/Services/sosService.ts: SOS trigger (realtime) +
// admin list/ack/resolve + the 60s escalation sweep (wired by Wave 7 jobs).
@Injectable()
export class SosService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeGatewayToken))
    private readonly realtime: RealtimeGateway,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  async isTripMember(user: SosUser, tripId: string): Promise<boolean> {
    if (!user?.id || !tripId) return false;
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, driverId: true },
    });
    if (!trip) return false;
    if (trip.driverId === user.id) return true;
    const booking = await this.prisma.booking.findFirst({
      where: { tripId, passengerId: user.id, status: 'confirmed' },
      select: { id: true },
    });
    return !!booking;
  }

  async findActiveForUser(userId: string): Promise<{ id: string } | null> {
    return this.prisma.sosEvent.findFirst({
      where: { userId, status: { in: [...ACTIVE_SOS_STATUSES] as never } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
  }

  private async alertPayload(event: { id: string; userId: string; tripId: string; lat: unknown; lng: unknown; urgency: string; escalationLevel: number; createdAt: Date | null }): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: event.userId },
      select: { id: true, fullName: true },
    });
    // spec 013 (SOC6): carry the driver's last known position alongside the
    // passenger's. One indexed lookup, no schema change.
    let driverLat: number | null = null;
    let driverLng: number | null = null;
    try {
      const last = await this.prisma.tripLocation.findFirst({
        where: { tripId: event.tripId },
        orderBy: { createdAt: 'desc' },
        select: { lat: true, lng: true },
      });
      if (last) {
        driverLat = Number(last.lat);
        driverLng = Number(last.lng);
      }
    } catch {
      // location history unavailable — alert still goes out
    }
    return {
      sos_event_id: event.id,
      user_id: event.userId,
      user_name: user ? user.fullName : null,
      trip_id: event.tripId,
      lat: Number(event.lat),
      lng: Number(event.lng),
      driver_lat: driverLat,
      driver_lng: driverLng,
      urgency: event.urgency,
      escalation_level: event.escalationLevel,
      triggered_at: event.createdAt ? event.createdAt.toISOString() : null,
      timestamp: Date.now(),
    };
  }

  // sos:trigger — creates (or reuses) an active SOS event for the trip and
  // broadcasts the alert to the admin room. Trip context is required and the
  // sender must be a confirmed participant of an active trip.
  async trigger(
    user: SosUser,
    input: { tripId?: string; lat?: number; lng?: number; urgency?: string },
  ): Promise<{ sos_event_id: string; reused: boolean }> {
    const { tripId, lat, lng, urgency = 'high' } = input ?? {};
    if (!tripId) throw validationError('TRIP_ID_IS_REQUIRED_FOR_SOS');
    if (lat === undefined || lng === undefined) {
      throw validationError('LAT_AND_LNG_ARE_REQUIRED');
    }

    const member = await this.isTripMember(user, tripId);
    if (!member) {
      throw new ForbiddenException({ message: 'YOU_ARE_NOT_A_PARTICIPANT_OF_THIS_TRIP', code: 'FORBIDDEN' });
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) {
      throw new ConflictException({ message: 'SOS_IS_ONLY_AVAILABLE_DURING_AN_ACTIVE_TRIP', code: 'SOS_IS_ONLY_AVAILABLE_DURING_AN_ACTIVE_TRIP' });
    }

    const active = await this.findActiveForUser(user.id);
    if (active) {
      return { sos_event_id: active.id, reused: true };
    }

    const event = await this.prisma.sosEvent.create({
      data: {
        userId: user.id,
        tripId,
        lat,
        lng,
        urgency,
        status: 'pending',
        escalationLevel: 0,
        lastAlertAt: new Date(),
      },
    });

    const payloadOut = await this.alertPayload(event);
    this.realtime.emitToUser(user.id, 'sos:ack', {
      status: 'received',
      sos_event_id: event.id,
      assigned_support_id: null,
      timestamp: Date.now(),
    });
    this.realtime.emitToRole('admin', 'sos:alert', payloadOut);
    this.realtime.emitToRole('admin', 'admin:sos_alert', payloadOut);
    this.metrics.recordEvent('sos:alert');
    this.metrics.recordDelivery();
    return { sos_event_id: event.id, reused: false };
  }

  async listAdmin(
    _actor: SosUser,
    input: { status?: string; page?: number; limit?: number },
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const where: Record<string, unknown> = {};
    if (input.status && (SOS_STATUSES as readonly string[]).includes(input.status.toLowerCase())) {
      where.status = input.status.toLowerCase();
    }
    const { page: p, limit: l, offset } = parsePagination(input);
    const [rows, count] = await Promise.all([
      this.prisma.sosEvent.findMany({
        where,
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: l,
      }),
      this.prisma.sosEvent.count({ where }),
    ]);
    return {
      data: rows.map((r) => serialize(r as unknown as SosRow, (r as unknown as SosRow).user ?? null)),
      pagination: buildPagination(count, p, l),
    };
  }

  async acknowledge(actor: SosUser, sosId: string): Promise<{ sos_event: Record<string, unknown> }> {
    const event = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } })) as unknown as SosRow | null;
    if (!event) throw new NotFoundException({ message: 'SOS_EVENT_NOT_FOUND', code: 'SOS_EVENT_NOT_FOUND' });
    if (event.status === 'resolved' || event.status === 'cancelled') {
      throw new ConflictException({ message: 'SOS_EVENT_IS_ALREADY_CLOSED', code: 'SOS_EVENT_IS_ALREADY_CLOSED' });
    }
    if (event.status !== 'acknowledged') {
      await this.prisma.sosEvent.update({
        where: { id: sosId },
        data: { status: 'acknowledged', acknowledgedBy: actor.id, acknowledgedAt: new Date() },
      });
    }
    const updated = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } })) as unknown as SosRow;
    // Express auditService.track is a best-effort external collector call;
    // covered Nest-side by the global AuditInterceptor, no DB write here.
    return { sos_event: serialize(updated) };
  }

  async resolve(
    actor: SosUser,
    sosId: string,
    resolutionNote?: string,
  ): Promise<{ sos_event: Record<string, unknown> }> {
    const event = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } })) as unknown as SosRow | null;
    if (!event) throw new NotFoundException({ message: 'SOS_EVENT_NOT_FOUND', code: 'SOS_EVENT_NOT_FOUND' });
    if (event.status === 'resolved' || event.status === 'cancelled') {
      throw new ConflictException({ message: 'SOS_EVENT_IS_ALREADY_CLOSED', code: 'SOS_EVENT_IS_ALREADY_CLOSED' });
    }

    const resolvedAt = new Date();
    await this.prisma.sosEvent.update({
      where: { id: sosId },
      data: {
        status: 'resolved',
        resolvedBy: actor.id,
        resolutionNote: resolutionNote || null,
        resolvedAt,
      },
    });

    const out = {
      sos_event_id: event.id,
      resolution: resolutionNote || 'Resolved',
      resolved_by: actor.id,
      resolved_at: resolvedAt.toISOString(),
      timestamp: Date.now(),
    };
    this.realtime.emitToUser(event.userId, 'sos:resolved', out);
    this.realtime.emitToRole('admin', 'sos:resolved', out);
    this.metrics.recordEvent('sos:resolved');

    const updated = (await this.prisma.sosEvent.findUnique({ where: { id: sosId } })) as unknown as SosRow;
    return { sos_event: serialize(updated) };
  }

  // Called by the escalation job every 60s: re-alerts unresolved events and
  // bumps escalation to high priority after 5 minutes.
  async runEscalation(): Promise<{ alerted: number; escalated: number }> {
    const now = Date.now();
    const events = (await this.prisma.sosEvent.findMany({
      where: { status: { in: [...ACTIVE_SOS_STATUSES] as never } },
    })) as unknown as Array<SosRow & { lastAlertAt: Date | null }>;

    let alerted = 0;
    let escalated = 0;
    for (const event of events) {
      const createdAt = event.createdAt ? new Date(event.createdAt).getTime() : now;
      const updates: Record<string, unknown> = {};

      if (event.escalationLevel === 0 && now - createdAt >= ESCALATION_AFTER_MS) {
        updates.escalationLevel = 1;
        escalated += 1;
      }

      const lastAlert = event.lastAlertAt ? new Date(event.lastAlertAt).getTime() : 0;
      if (now - lastAlert >= RE_ALERT_INTERVAL_MS) {
        updates.lastAlertAt = new Date();
        alerted += 1;
      }

      if (Object.keys(updates).length > 0) {
        await this.prisma.sosEvent.update({ where: { id: event.id }, data: updates });
      }

      if (now - lastAlert >= RE_ALERT_INTERVAL_MS || event.escalationLevel === 1) {
        const payloadOut = await this.alertPayload(event);
        this.realtime.emitToRole('admin', 'sos:alert', payloadOut);
        this.realtime.emitToRole('admin', 'admin:sos_alert', payloadOut);
        this.metrics.recordEvent('sos:realert');
      }
    }
    return { alerted, escalated };
  }
}
