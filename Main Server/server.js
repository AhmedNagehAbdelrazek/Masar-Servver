require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const { createSocketServer } = require('./socketServer');
const { initDatabase } = require('./config/database');
const { startJobs } = require('./jobs');
const { seedAdmin } = require('./seed');
const { seedMockData } = require('./seed-mock');

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initDatabase();
  await seedAdmin();
  await seedMockData();
  startJobs();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

const app = createApp();
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);

module.exports = app;