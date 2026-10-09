import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UuidPlanIdParam } from './dto/plan-id.param.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { PlansService } from './plans.service.js';
export declare class AdminPlansController {
    private readonly plans;
    constructor(plans: PlansService);
    listPlans(): Promise<{
        plans: Record<string, unknown>[];
    }>;
    createPlan(dto: CreatePlanDto, user?: AuthUser): Promise<{
        plan: Record<string, unknown>;
    }>;
    updatePlan(params: UuidPlanIdParam, dto: UpdatePlanDto, user?: AuthUser): Promise<{
        plan: Record<string, unknown>;
    }>;
    deactivatePlan(planId: string, user?: AuthUser): Promise<{
        message: string;
    }>;
}
