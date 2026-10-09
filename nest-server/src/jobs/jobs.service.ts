import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

// Nest-native port target: Main Server/jobs/* (9 schedules).
// Bodies are ported incrementally in Phase 5; lastrun keys jobs:lastrun:*
// with 3d TTL + overlap guard mirror the Express scheduler semantics.
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  private run(name: string): void {
    if (process.env.NODE_ENV === 'test') return;
    this.logger.debug(`job tick: ${name} (TODO phase-5 port)`);
  }

  @Cron(process.env.JOB_EXPIRY_SWEEP_CRON ?? '0 0 * * *')
  expirySweep(): void {
    this.run('expirySweep');
  }

  @Cron(process.env.JOB_REMINDER_CRON ?? '0 9 * * *')
  expiryReminder(): void {
    this.run('expiryReminder');
  }

  @Cron('0 12 * * *')
  lowBalanceWarning(): void {
    this.run('lowBalanceWarning');
  }

  @Cron('*/1 * * * *')
  sosEscalation(): void {
    this.run('sosEscalation');
  }

  @Cron('0 3 * * *')
  dataRetention(): void {
    this.run('dataRetention');
  }

  @Cron('*/2 * * * *')
  routeRetry(): void {
    this.run('routeRetry');
  }

  @Cron(process.env.JOB_PATH_COMPACT_CRON ?? '*/10 * * * *')
  actualPath(): void {
    this.run('actualPath');
  }

  @Cron('0 2 * * *')
  driverStats(): void {
    this.run('driverStats');
  }

  @Cron('*/15 * * * *')
  tripLifecycle(): void {
    this.run('tripLifecycle');
  }
}
