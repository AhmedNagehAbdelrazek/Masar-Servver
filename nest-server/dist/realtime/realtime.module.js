var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, forwardRef } from '@nestjs/common';
import { ChatModule } from '../modules/chat/chat.module.js';
import { MapsModule } from '../modules/maps/maps.module.js';
import { NotificationsModule } from '../modules/notifications/notifications.module.js';
import { SosModule } from '../modules/sos/sos.module.js';
import { PresenceService } from './presence.service.js';
import { RealtimeGateway } from './realtime.gateway.js';
import { SocketRateLimiter } from './socket-rate-limiter.service.js';
import { TrackingService } from './tracking.service.js';
let RealtimeModule = class RealtimeModule {
};
RealtimeModule = __decorate([
    Module({
        imports: [
            forwardRef(() => NotificationsModule),
            forwardRef(() => ChatModule),
            forwardRef(() => SosModule),
            MapsModule,
        ],
        providers: [RealtimeGateway, TrackingService, PresenceService, SocketRateLimiter],
        exports: [RealtimeGateway, TrackingService, PresenceService, SocketRateLimiter],
    })
], RealtimeModule);
export { RealtimeModule };
//# sourceMappingURL=realtime.module.js.map