var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
import { Logger, UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard.js';
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    logger = new Logger(RealtimeGateway_1.name);
    server;
    handleConnection(client) {
        const user = client.data.user;
        if (user) {
            void client.join(`user:${user.id}`);
            void client.join(`role:${user.role}`);
        }
        this.logger.debug(`socket connected ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`socket disconnected ${client.id}`);
    }
    async trackingJoin(client, payload) {
        await client.join(`trip:${payload.trip_id}`);
        return { ok: true };
    }
    emitToUser(userId, event, data) {
        this.server?.to(`user:${userId}`).emit(event, data);
    }
    emitToRole(role, event, data) {
        this.server?.to(`role:${role}`).emit(event, data);
    }
    emitToRoom(room, event, data) {
        this.server?.to(room).emit(event, data);
    }
    async disconnectUserSockets(userId) {
        try {
            await this.server?.in(`user:${userId}`).disconnectSockets();
        }
        catch {
        }
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('tracking:join'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "trackingJoin", null);
RealtimeGateway = RealtimeGateway_1 = __decorate([
    WebSocketGateway({ cors: true, connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 } })
], RealtimeGateway);
export { RealtimeGateway };
//# sourceMappingURL=realtime.gateway.js.map