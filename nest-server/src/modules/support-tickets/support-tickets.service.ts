import { randomBytes } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './dto/support-ticket.dto.js';

export interface TicketUser {
  id: string;
  role: string;
}

const STAFF_ROLES = ['admin', 'support', 'moderator'];

function isStaff(user: TicketUser): boolean {
  return !!user && STAFF_ROLES.includes(user.role);
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferenceCode(prefix: string): string {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }
  return `${prefix}-${code}`;
}

interface TicketRow {
  id: string;
  referenceCode: string | null;
  userId: string;
  category: string;
  subject: string;
  description: string;
  priority: string | null;
  status: string | null;
  assignedTo: string | null;
  bookingId: string | null;
  tripId: string | null;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { fullName: string | null } | null;
  messages?: TicketMessageRow[];
}

interface TicketMessageRow {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: Date;
  sender?: { fullName: string | null; role: string } | null;
}

function serializeMessage(message: TicketMessageRow): Record<string, unknown> {
  return {
    id: message.id,
    ticket_id: message.ticketId,
    sender_id: message.senderId,
    sender_name: message.sender ? message.sender.fullName : null,
    sender_role: message.sender ? message.sender.role : null,
    message: message.message,
    created_at: message.createdAt,
  };
}

function serializeTicket(ticket: TicketRow, includeMessages = false): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: ticket.id,
    reference_code: ticket.referenceCode,
    user_id: ticket.userId,
    user_name: ticket.user ? ticket.user.fullName : null,
    category: ticket.category,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    assigned_to: ticket.assignedTo || null,
    booking_id: ticket.bookingId || null,
    trip_id: ticket.tripId || null,
    resolution_notes: ticket.resolutionNotes || null,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  };
  if (includeMessages) {
    base.messages = (ticket.messages || []).map(serializeMessage);
  }
  return base;
}

// Port of Main Server/Services/supportTicketService.ts.
@Injectable()
export class SupportTicketsService {
  private readonly logger = new Logger(SupportTicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async uniqueTicketCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferenceCode('TKT');
      const existing = await this.prisma.supportTicket.findUnique({ where: { referenceCode: code } });
      if (!existing) return code;
    }
    throw new ConflictException({ message: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE', code: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE' });
  }

  private async notifyStaff(ticket: { referenceCode: string | null; subject: string }): Promise<void> {
    try {
      const staff = await this.prisma.user.findMany({
        where: { role: { in: [...STAFF_ROLES] as Array<'admin' | 'support' | 'moderator'> }, status: 'active' },
        select: { id: true },
      });
      await Promise.allSettled(
        staff.map((member) =>
          this.notifications.sendToUser({ id: member.id }, 'SUPPORT_TICKET_NEW', {
            channels: ['in_app'],
            vars: {
              reference_code: ticket.referenceCode,
              subject: ticket.subject,
            },
          }),
        ),
      );
    } catch (err) {
      this.logger.warn(`staff notification failed: ${(err as Error).message}`);
    }
  }

  async createTicket(
    user: TicketUser,
    input: { category: string; subject: string; description: string; priority?: string; booking_id?: string; trip_id?: string },
  ): Promise<Record<string, unknown>> {
    const referenceCode = await this.uniqueTicketCode();

    if (input.booking_id) {
      const booking = await this.prisma.booking.findUnique({ where: { id: input.booking_id } });
      if (!booking) throw new NotFoundException({ message: 'REFERENCED_BOOKING_NOT_FOUND', code: 'REFERENCED_BOOKING_NOT_FOUND' });
    }

    const ticket = (await this.prisma.supportTicket.create({
      data: {
        userId: user.id,
        category: input.category,
        subject: input.subject,
        description: input.description,
        priority: (input.priority ?? 'medium') as (typeof TICKET_PRIORITIES)[number],
        status: 'open',
        referenceCode,
        bookingId: input.booking_id || null,
        tripId: input.trip_id || null,
      },
    })) as unknown as TicketRow;

    // Fire-and-forget like Express setImmediate(notifyStaff).
    setImmediate(() => {
      void this.notifyStaff(ticket);
    });

    return serializeTicket(ticket);
  }

  async listTickets(
    user: TicketUser,
    filters: { status?: string; priority?: string; page?: number; limit?: number },
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const where: Record<string, unknown> = {};
    if (!isStaff(user)) {
      where.userId = user.id;
    }
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    const { page, limit, offset } = parsePagination(filters);
    const [rows, count] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return {
      data: rows.map((t) => serializeTicket(t as unknown as TicketRow)),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getTicket(user: TicketUser, ticketId: string): Promise<{ support_ticket: Record<string, unknown> }> {
    const ticket = (await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, fullName: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })) as unknown as (TicketRow & { messages: TicketMessageRow[] }) | null;
    if (!ticket) throw new NotFoundException({ message: 'SUPPORT_TICKET_NOT_FOUND', code: 'SUPPORT_TICKET_NOT_FOUND' });
    if (!isStaff(user) && ticket.userId !== user.id) {
      throw new ForbiddenException({ message: 'YOU_CAN_ONLY_VIEW_YOUR_OWN_SUPPORT_TICKETS', code: 'FORBIDDEN' });
    }
    // SupportTicketMessage has no sender relation in the schema — attach the
    // sender profile per message like Express include did.
    const senderIds = [...new Set((ticket.messages || []).map((m) => m.senderId))];
    const senders = await this.prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, fullName: true, role: true },
    });
    const byId = new Map(senders.map((s) => [s.id, s]));
    ticket.messages = (ticket.messages || []).map((m) => ({
      ...m,
      sender: byId.get(m.senderId) ?? null,
    }));
    return { support_ticket: serializeTicket(ticket, true) };
  }

  private async assertTicketExists(ticketId: string): Promise<TicketRow & { userId: string; status: string | null }> {
    const ticket = (await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    })) as unknown as (TicketRow & { userId: string; status: string | null }) | null;
    if (!ticket) throw new NotFoundException({ message: 'SUPPORT_TICKET_NOT_FOUND', code: 'SUPPORT_TICKET_NOT_FOUND' });
    return ticket;
  }

  async updateTicket(
    actorId: string,
    ticketId: string,
    input: { assigned_to?: string; priority?: string; category?: string; resolution_notes?: string },
  ): Promise<Record<string, unknown>> {
    await this.assertTicketExists(ticketId);
    const updates: Record<string, unknown> = {};
    if (input.assigned_to !== undefined) updates.assignedTo = input.assigned_to;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.category !== undefined) updates.category = input.category;
    if (input.resolution_notes !== undefined) updates.resolutionNotes = input.resolution_notes;

    const ticket = (await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updates,
    })) as unknown as TicketRow;
    void actorId;
    return serializeTicket(ticket);
  }

  async updateTicketStatus(
    actorId: string,
    ticketId: string,
    status: (typeof TICKET_STATUSES)[number],
  ): Promise<Record<string, unknown>> {
    const ticket = await this.assertTicketExists(ticketId);
    if (ticket.status === 'closed' && status !== 'closed') {
      throw new ConflictException({ message: 'CLOSED_TICKETS_CANNOT_BE_REOPENED', code: 'CLOSED_TICKETS_CANNOT_BE_REOPENED' });
    }
    const updated = (await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    })) as unknown as TicketRow;
    void actorId;
    return serializeTicket(updated);
  }

  async addMessage(user: TicketUser, ticketId: string, messageText: string): Promise<Record<string, unknown>> {
    const ticket = await this.assertTicketExists(ticketId);
    if (!isStaff(user) && ticket.userId !== user.id) {
      throw new ForbiddenException({ message: 'YOU_CAN_ONLY_REPLY_TO_YOUR_OWN_SUPPORT_TICKETS', code: 'FORBIDDEN' });
    }
    const message = await this.prisma.supportTicketMessage.create({
      data: { ticketId, senderId: user.id, message: messageText },
    });
    const sender = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, role: true },
    });
    return serializeMessage({
      ...(message as unknown as TicketMessageRow),
      sender: sender as TicketMessageRow['sender'],
    });
  }
}
