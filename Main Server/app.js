const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('./Models/index');
const apiRouter = require('./Routes/index');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const { createAuditMiddleware } = require('./external packages/audit-client');
const { audit } = require('./config/audit');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(createAuditMiddleware(audit, {
    skip: (req) => req.method === 'GET' || req.path === '/health'
  }));
  app.use(morgan('short'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    '/uploads',
    // express.static(process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, 'uploads'))
    express.static(path.join(__dirname, 'uploads'))
  // );
  );

  app.use('/api', apiRouter);

  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  app.use(globalErrorHandler);

  return app;
}

module.exports = createApp;
