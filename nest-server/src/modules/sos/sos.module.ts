import { forwardRef, Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { SosController } from './sos.controller.js';
import { SosService } from './sos.service.js';

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [SosController],
  providers: [SosService],
  exports: [SosService],
})
export class SosModule {}
