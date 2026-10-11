import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ResolveSosDto, SosIdParam, SosListQuery } from './dto/sos.query.js';
import { SosService } from './sos.service.js';
export declare class SosController {
    private readonly sos;
    constructor(sos: SosService);
    listSos(query: SosListQuery, _user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    ackSos(params: SosIdParam, user?: AuthUser): Promise<{
        sos_event: Record<string, unknown>;
    }>;
    resolveSos(params: SosIdParam, dto: ResolveSosDto, user?: AuthUser): Promise<{
        sos_event: Record<string, unknown>;
    }>;
}
