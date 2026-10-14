import { config } from 'dotenv';
import { join } from 'node:path';
config({ path: join(process.cwd(), '.env.test') });
process.env.NODE_ENV = 'test';
process.env.APP_LOCALE ??= 'en';
//# sourceMappingURL=setup.js.map