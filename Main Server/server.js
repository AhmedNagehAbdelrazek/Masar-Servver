require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const { createSocketServer } = require('./socketServer');
const { initDatabase } = require('./config/database');
const { startJobs } = require('./jobs');
const { seedAdmin } = require('./seed');

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log("Audit URL", process.env.AUDIT_COLLECTOR_URL);
  console.log("AUDIT_SERVICE_ID", process.env.AUDIT_SERVICE_ID);
  console.log("AUDIT_CLIENT_SECRET", process.env.AUDIT_CLIENT_SECRET);

  await initDatabase();
  await seedAdmin();
  startJobs();
  console.log(process.env.CLOUDINARY_API_SECRET);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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