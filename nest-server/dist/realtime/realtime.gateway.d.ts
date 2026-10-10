import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    handleConnection(client: Socket & {
        data: {
            user?: {
                id: string;
                role: string;
            };
        };
    }): void;
    handleDisconnect(client: Socket): void;
    trackingJoin(client: Socket, payload: {
        trip_id: string;
    }): Promise<{
        ok: boolean;
    }>;
    emitToUser(userId: string, event: string, data: unknown): void;
    emitToRole(role: string, event: string, data: unknown): void;
    emitToRoom(room: string, event: string, data: unknown): void;
    disconnectUserSockets(userId: string): Promise<void>;
}
