import { PlansService } from './plans.service.js';
export declare class PlansController {
    private readonly plans;
    constructor(plans: PlansService);
    listActivePlans(): Promise<{
        plans: Record<string, unknown>[];
    }>;
}
