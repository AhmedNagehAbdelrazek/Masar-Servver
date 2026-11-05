import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as realtimeMetrics from '../Services/realtimeMetrics';
import { getIO } from '../socketServer';

const realtimeHealth = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const snapshot: unknown = (realtimeMetrics as unknown as { getSnapshot: (io: unknown) => unknown }).getSnapshot(getIO());
  res.status(200).json(snapshot);
});

export { realtimeHealth };
export default { realtimeHealth };
