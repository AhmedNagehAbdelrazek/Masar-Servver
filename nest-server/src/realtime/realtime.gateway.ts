import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard.js';

// Nest-native port target: Main Server/socketServer.ts + sockets/* (7 modules).
// Rooms preserved: user:{id}, role:{role}, trip:{id}, booking:{id}, support:{id}.
// Redis adapter wiring happens in main.ts bootstrap (skipped in test env).
@WebSocketGateway({ cors: true, connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket & { data: { user?: { id: string; role: string } } }): void {
    const user = client.data.user;
    if (user) {
      void client.join(`user:${user.id}`);
      void client.join(`role:${user.role}`);
    }
    this.logger.debug(`socket connected ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`socket disconnected ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('tracking:join')
  async trackingJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { trip_id: string },
  ): Promise<{ ok: boolean }> {
    await client.join(`trip:${payload.trip_id}`);
    return { ok: true };
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: unknown): void {
    this.server?.to(`role:${role}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.server?.to(room).emit(event, data);
  }

  async disconnectUserSockets(userId: string): Promise<void> {
    try {
      await this.server?.in(`user:${userId}`).disconnectSockets();
    } catch {
      // best-effort
    }
  }
}
