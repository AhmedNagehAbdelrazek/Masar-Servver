declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production" | "test";
    PORT?: string;
    DB_USERNAME?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    JWT_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    REDIS_URL?: string;
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;
    LOCAL_UPLOAD_DIR?: string;
    PGSSLMODE?: string;
    DB_SSL_MODE?: string;
    DB_SSL?: string;
    DB_SSL_REJECT_UNAUTHORIZED?: string;
    JOB_DRIVER_STATS_CRON?: string;
  }
}
