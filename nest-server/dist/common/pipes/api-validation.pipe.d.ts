import { ValidationPipe } from '@nestjs/common';
export interface ValidationDetail {
    field: string;
    message: string;
    value?: unknown;
}
export declare class ApiValidationPipe extends ValidationPipe {
    constructor();
}
