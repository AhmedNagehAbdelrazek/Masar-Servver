import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
function toDetails(errors, parent = '') {
    const out = [];
    for (const err of errors) {
        const field = parent ? `${parent}.${err.property}` : err.property;
        if (err.constraints) {
            for (const message of Object.values(err.constraints)) {
                out.push({ field, message, value: err.value });
            }
        }
        if (err.children?.length)
            out.push(...toDetails(err.children, field));
    }
    return out;
}
export class ApiValidationPipe extends ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            exceptionFactory: (errors) => new UnprocessableEntityException({
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: toDetails(errors),
            }),
        });
    }
}
//# sourceMappingURL=api-validation.pipe.js.map