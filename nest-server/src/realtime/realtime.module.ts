import { Module, forwardRef } from '@nestjs/common';
import { ChatModule } from '../modules/chat/chat.module.js';
import { MapsModule } from '../modules/maps/maps.module.js';
import { NotificationsModule } from '../modules/notifications/notifications.module.js';
import { SosModule } from '../modules/sos/sos.module.js';
import { PresenceService } from './presence.service.js';
import { RealtimeGateway } from './realtime.gateway.js';
import { RealtimeMetricsService } from './realtime-metrics.service.js';
import { SocketRateLimiter } from './socket-rate-limiter.service.js';
import { TrackingService } from './tracking.service.js';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => ChatModule),
    forwardRef(() => SosModule),
    MapsModule,
  ],
  providers: [RealtimeGateway, TrackingService, PresenceService, SocketRateLimiter, RealtimeMetricsService],
  exports: [RealtimeGateway, TrackingService, PresenceService, SocketRateLimiter, RealtimeMetricsService],
})
export class RealtimeModule {}
