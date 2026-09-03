import { Server, Socket } from 'socket.io';
import presenceService from '../Services/presenceService';
import { ok } from '../utils/socketAck';

interface AuthedSocket extends Socket {
  data: { user?: { id: string; role: string } };
}

const presenceSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user as { id: string; role: string };
  if (!user) return;

  (presenceService as unknown as { markOnline: (id: string, role: string) => Promise<void> }).markOnline(user.id, user.role).catch(() => { return undefined; });

  socket.on('presence:heartbeat', async (_payload: unknown, ack?: (r: unknown) => void) => {
    try {
      await (presenceService as unknown as { markOnline: (id: string, role: string) => Promise<void> }).markOnline(user.id, user.role);
      if (ack) ack(ok({ status: 'online' }));
    } catch (_err: unknown) {
      if (ack) ack(ok({ status: 'online' }));
    }
  });

  socket.on('disconnect', () => {
    (presenceService as unknown as { scheduleOffline: (id: string, role: string) => void }).scheduleOffline(user.id, user.role);
  });
};

export default presenceSocket;
module.exports = presenceSocket;
