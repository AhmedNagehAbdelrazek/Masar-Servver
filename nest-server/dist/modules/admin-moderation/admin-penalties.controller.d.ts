import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { PenaltyService } from '../driver/penalty.service.js';
import { IssuePenaltyDto } from './dto/admin-moderation.dto.js';
export declare class AdminPenaltiesController {
    private readonly penalties;
    constructor(penalties: PenaltyService);
    issuePenalty(dto: IssuePenaltyDto, user?: AuthUser): Promise<{
        penalty: Record<string, unknown>;
    }>;
}
