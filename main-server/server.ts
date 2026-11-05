import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import createApp from './app';
import { createSocketServer } from './socketServer';
import { initDatabase } from './config/database';
import { startJobs } from './jobs';
import { seedAdmin } from './seed';
import { seedMockData } from './seed-mock';

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = createApp();
const httpServer: http.Server = http.createServer(app);
createSocketServer(httpServer);

async function startServer(): Promise<void> {
  await initDatabase();
  await seedAdmin();
  await seedMockData();
  startJobs();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
module.exports = app;
