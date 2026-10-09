import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module.js';
import { AdminPaymentMethodsController } from './admin-payment-methods.controller.js';
import { PaymentMethodsController } from './payment-methods.controller.js';

@Module({
  imports: [PlansModule],
  controllers: [PaymentMethodsController, AdminPaymentMethodsController],
})
export class PaymentMethodsModule {}
