import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../modules/chat/chat.service.js';
import { SosService } from '../modules/sos/sos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { PresenceService } from './presence.service.js';
import { SocketRateLimiter } from './socket-rate-limiter.service.js';
import { TrackingService } from './tracking.service.js';
type AuthedSocket = Socket & {
    data: {
        user?: {
            id: string;
            role: string;
        };
        typingLast?: Map<string, number>;
    };
};
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly tracking;
    private readonly presence;
    private readonly rateLimiter;
    private readonly chat;
    private readonly sos;
    private readonly jwt;
    private readonly config;
    private readonly redis;
    private readonly prisma;
    private readonly logger;
    server: Server;
    constructor(tracking: TrackingService, presence: PresenceService, rateLimiter: SocketRateLimiter, chat: ChatService, sos: SosService, jwt: JwtService, config: ConfigService, redis: RedisService, prisma: PrismaService);
    afterInit(server: Server): void;
    handleConnection(client: AuthedSocket): void;
    handleDisconnect(client: AuthedSocket): void;
    trackingJoin(client: AuthedSocket, payload: {
        trip_id: string;
    }): Promise<unknown>;
    trackingStart(client: AuthedSocket, payload: {
        trip_id: string;
    }): Promise<unknown>;
    trackingLocation(client: AuthedSocket, payload: Record<string, unknown>): Promise<unknown>;
    trackingStop(client: AuthedSocket, payload: {
        trip_id: string;
    }): Promise<unknown>;
    presenceHeartbeat(client: AuthedSocket): Promise<unknown>;
    chatJoin(client: AuthedSocket, payload: {
        booking_id?: string;
        support_ticket_id?: string;
    }): Promise<unknown>;
    chatLeave(client: AuthedSocket, payload: {
        booking_id?: string;
        support_ticket_id?: string;
    }): unknown;
    chatSend(client: AuthedSocket, payload: {
        booking_id?: string;
        support_ticket_id?: string;
        message?: string;
        message_type?: string;
    }): Promise<unknown>;
    chatTyping(client: AuthedSocket, payload: {
        booking_id?: string;
        support_ticket_id?: string;
        is_typing?: boolean;
    }): Promise<unknown>;
    chatRead(client: AuthedSocket, payload: {
        message_id?: string;
        booking_id?: string;
        support_ticket_id?: string;
    }): Promise<unknown>;
    sosTrigger(client: AuthedSocket, payload: {
        trip_id?: string;
        lat?: number;
        lng?: number;
        urgency?: string;
    }): Promise<unknown>;
    emitToUser(userId: string, event: string, data: unknown): void;
    emitToRole(role: string, event: string, data: unknown): void;
    emitToRoom(room: string, event: string, data: unknown): void;
    disconnectUserSockets(_userId: string): Promise<void>;
    private disconnectUserSocketsByRoom;
}
export {};
