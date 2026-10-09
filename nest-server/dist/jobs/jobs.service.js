var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JobsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
let JobsService = JobsService_1 = class JobsService {
    logger = new Logger(JobsService_1.name);
    run(name) {
        if (process.env.NODE_ENV === 'test')
            return;
        this.logger.debug(`job tick: ${name} (TODO phase-5 port)`);
    }
    expirySweep() {
        this.run('expirySweep');
    }
    expiryReminder() {
        this.run('expiryReminder');
    }
    lowBalanceWarning() {
        this.run('lowBalanceWarning');
    }
    sosEscalation() {
        this.run('sosEscalation');
    }
    dataRetention() {
        this.run('dataRetention');
    }
    routeRetry() {
        this.run('routeRetry');
    }
    actualPath() {
        this.run('actualPath');
    }
    driverStats() {
        this.run('driverStats');
    }
    tripLifecycle() {
        this.run('tripLifecycle');
    }
};
__decorate([
    Cron(process.env.JOB_EXPIRY_SWEEP_CRON ?? '0 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "expirySweep", null);
__decorate([
    Cron(process.env.JOB_REMINDER_CRON ?? '0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "expiryReminder", null);
__decorate([
    Cron('0 12 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "lowBalanceWarning", null);
__decorate([
    Cron('*/1 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "sosEscalation", null);
__decorate([
    Cron('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "dataRetention", null);
__decorate([
    Cron('*/2 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "routeRetry", null);
__decorate([
    Cron(process.env.JOB_PATH_COMPACT_CRON ?? '*/10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "actualPath", null);
__decorate([
    Cron('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "driverStats", null);
__decorate([
    Cron('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "tripLifecycle", null);
JobsService = JobsService_1 = __decorate([
    Injectable()
], JobsService);
export { JobsService };
//# sourceMappingURL=jobs.service.js.map