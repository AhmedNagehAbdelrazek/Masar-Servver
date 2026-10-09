import { Module } from '@nestjs/common';
import { SosController } from './sos.controller.js';
import { SosService } from './sos.service.js';

@Module({
  controllers: [SosController],
  providers: [SosService]
})
export class SosModule {}
