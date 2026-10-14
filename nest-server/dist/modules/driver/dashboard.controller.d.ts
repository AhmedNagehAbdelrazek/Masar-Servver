import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { DriverService } from './driver.service.js';
export declare class DashboardController {
    private readonly driver;
    constructor(driver: DriverService);
    getDashboard(user?: AuthUser): Promise<Record<string, unknown>>;
}
