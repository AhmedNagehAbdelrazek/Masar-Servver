import { Server, Socket } from 'socket.io';
import notificationService from '../Services/notificationService';
import realtimeMetrics from '../Services/realtimeMetrics';
import { ok, errorFromApiError } from '../utils/socketAck';

interface AuthedSocket extends Socket {
  data: { user?: { id: string; role: string } };
}

const notificationSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user as { id: string };
  if (!user) return;

  const pushCount = async (): Promise<number> => {
    const count: number = await (notificationService as unknown as { countUnread: (id: string) => Promise<number> }).countUnread(user.id);
    socket.emit('notification:count', { unread_count: count, timestamp: Date.now() });
    return count;
  };

  pushCount().catch(() => { return undefined; });

  socket.on('notification:read', async (payload: { notification_id?: string }, ack?: (r: unknown) => void) => {
    try {
      const result = await (notificationService as unknown as { markRead: (id: string, nid: string | undefined) => Promise<{ id: string }> }).markRead(user.id, payload && payload.notification_id);
      await pushCount();
      (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('notification:read');
      if (ack) ack(ok({ notification_id: result.id }));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });

  socket.on('notification:read_all', async (_payload: unknown, ack?: (r: unknown) => void) => {
    try {
      const result = await (notificationService as unknown as { markAllRead: (id: string) => Promise<unknown> }).markAllRead(user.id);
      await pushCount();
      (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('notification:read_all');
      if (ack) ack(ok(result));
    } catch (err: unknown) {
      if (ack) ack(errorFromApiError(err as Error));
    }
  });
};

export default notificationSocket;
module.exports = notificationSocket;
