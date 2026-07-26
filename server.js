require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const { createSocketServer } = require('./socketServer');
const { initDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initDatabase();

  
  if(process.env.NODE_ENV == "development") {
      httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

const app = createApp();
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);

module.exports = app;