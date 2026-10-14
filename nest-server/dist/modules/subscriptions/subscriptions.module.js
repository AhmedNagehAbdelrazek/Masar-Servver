var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { BalanceModule } from '../balance/balance.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AdminSubscriptionsController } from './admin-subscriptions.controller.js';
import { CommissionService } from './commission.service.js';
import { HomeService } from './home.service.js';
import { RecentSearchService } from './recent-search.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';
let SubscriptionsModule = class SubscriptionsModule {
};
SubscriptionsModule = __decorate([
    Module({
        imports: [BalanceModule, NotificationsModule, RealtimeModule],
        controllers: [SubscriptionsController, AdminSubscriptionsController],
        providers: [SubscriptionsService, CommissionService, HomeService, RecentSearchService],
        exports: [SubscriptionsService, CommissionService, HomeService, RecentSearchService],
    })
], SubscriptionsModule);
export { SubscriptionsModule };
//# sourceMappingURL=subscriptions.module.js.map