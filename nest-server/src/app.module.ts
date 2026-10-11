import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import configuration from './config/configuration.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { TripsModule } from './modules/trips/trips.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { RideRequestsModule } from './modules/ride-requests/ride-requests.module.js';
import { MapsModule } from './modules/maps/maps.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { SosModule } from './modules/sos/sos.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { RatingsModule } from './modules/ratings/ratings.module.js';
import { ComplaintsModule } from './modules/complaints/complaints.module.js';
import { FavoritesModule } from './modules/favorites/favorites.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { DriverModule } from './modules/driver/driver.module.js';
import { PlansModule } from './modules/plans/plans.module.js';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { SupportTicketsModule } from './modules/support-tickets/support-tickets.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module.js';
import { AdminModerationModule } from './modules/admin-moderation/admin-moderation.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    RedisModule,
    JwtModule.register({ global: true }),
    AuthModule,
    HealthModule,
    RealtimeModule,
    JobsModule,
    TripsModule,
    BookingsModule,
    RideRequestsModule,
    MapsModule,
    ChatModule,
    SosModule,
    NotificationsModule,
    RatingsModule,
    ComplaintsModule,
    FavoritesModule,
    ProfileModule,
    VehiclesModule,
    DriverModule,
    PlansModule,
    PaymentMethodsModule,
    SubscriptionsModule,
    SupportTicketsModule,
    UploadModule,
    AdminDashboardModule,
    AdminModerationModule,
  ],
  controllers: [],
  providers: [AuditInterceptor, JwtAuthGuard, RolesGuard],
})
export class AppModule {}
