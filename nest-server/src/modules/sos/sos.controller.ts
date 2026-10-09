import { Controller } from '@nestjs/common';

// Express parity: Routes/sosRoutes.ts mounted at /api/admin with internal
// paths /sos, /sos/:id/ack, /sos/:id/resolve (all protect + roleGuard(['admin'])).
@Controller('admin/sos')
export class SosController {}
