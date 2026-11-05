import { Server, Socket } from 'socket.io';
import realtimeMetrics from '../Services/realtimeMetrics';

interface AuthedSocket extends Socket {
  data: { user?: { id: string; role: string } };
}

const enforcementSocket = (io: Server, socket: AuthedSocket): void => {
  const user = socket.data.user;
  if (!user) return;

  socket.on('enforcement:ack', () => {
    (realtimeMetrics as unknown as { recordEvent: (e: string) => void }).recordEvent('enforcement:ack');
  });
};

export default enforcementSocket;
module.exports = enforcementSocket;
