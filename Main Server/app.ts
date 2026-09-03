import express, { Express, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import './Models/index';
import apiRouter from './Routes/index';
import globalErrorHandler from './middlewares/globalErrorHandler';
import { createAuditMiddleware } from './external packages/audit-client';
import { audit } from './config/audit';

function createApp(): Express {
  const app: Express = express();

  app.use(cors());
  app.use(helmet());
  app.use(
    createAuditMiddleware(audit, {
      skip: (req: Request): boolean => req.method === 'GET' || req.path === '/health',
    }),
  );
  app.use(morgan('short'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    '/uploads',
    // express.static(process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, 'uploads'))
    express.static(path.join(__dirname, 'uploads')),
  );

  app.use('/api', apiRouter);

  app.use((req: Request, res: Response): void => {
    res.status(404).json({
      status: 'error',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  app.use(globalErrorHandler);

  return app;
}

export default createApp;
module.exports = createApp;
