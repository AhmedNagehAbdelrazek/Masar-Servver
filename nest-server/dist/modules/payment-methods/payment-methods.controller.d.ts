import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, UuidMethodIdParam } from '../plans/dto/payment-method.dto.js';
import { PlansService } from '../plans/plans.service.js';
export declare class PaymentMethodsController {
    private readonly plans;
    constructor(plans: PlansService);
    listActiveMethods(): Promise<{
        methods: Record<string, unknown>[];
    }>;
    listAllMethods(): Promise<{
        methods: Record<string, unknown>[];
    }>;
    createMethod(dto: CreatePaymentMethodDto, user?: AuthUser): Promise<{
        payment_method: Record<string, unknown>;
    }>;
    updateMethod(params: UuidMethodIdParam, dto: UpdatePaymentMethodDto, user?: AuthUser): Promise<{
        payment_method: Record<string, unknown>;
    }>;
    deactivateMethod(methodId: string, user?: AuthUser): Promise<{
        message: string;
    }>;
}
