import { Module, forwardRef } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { HealthController } from './health.controller.js';

@Module({ imports: [forwardRef(() => RealtimeModule)], controllers: [HealthController] })
export class HealthModule {}
