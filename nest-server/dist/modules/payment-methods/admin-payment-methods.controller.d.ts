import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, UuidMethodIdParam } from '../plans/dto/payment-method.dto.js';
import { PlansService } from '../plans/plans.service.js';
export declare class AdminPaymentMethodsController {
    private readonly plans;
    constructor(plans: PlansService);
    listPaymentMethods(): Promise<{
        methods: Record<string, unknown>[];
    }>;
    createPaymentMethod(dto: CreatePaymentMethodDto, user?: AuthUser): Promise<{
        method: Record<string, unknown>;
    }>;
    updatePaymentMethod(params: UuidMethodIdParam, dto: UpdatePaymentMethodDto, user?: AuthUser): Promise<{
        method: Record<string, unknown>;
    }>;
    deactivatePaymentMethod(params: UuidMethodIdParam, user?: AuthUser): Promise<{
        message: string;
    }>;
}
