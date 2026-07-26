import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/audit',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  },
  ingestion: {
    bufferSize: parseInt(process.env.INGEST_BUFFER_SIZE || '1000', 10),
    flushIntervalMs: parseInt(process.env.INGEST_FLUSH_INTERVAL || '3000', 10),
    maxEventSize: parseInt(process.env.MAX_EVENT_SIZE || (2 * 1024 * 1024).toString(), 10),
  },
};
