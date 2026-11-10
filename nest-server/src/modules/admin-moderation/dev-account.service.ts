import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { DEV_PHONES } from '../../config/dev-accounts.js';

type DeletedRecords = Record<string, number>;

/**
 * Permanently deletes a configured developer account and every row that
 * belongs to its history. Only phones in DEV_PHONES are eligible; the caller
 * is expected to be an authenticated admin (controller role guard).
 *
 * Everything runs in one transaction so a partial purge can never leave the
 * account alive with its trips/bookings already removed.
 */
@Injectable()
export class DevAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async permanentlyDeleteDevUser(
    userId: string,
    _actorId?: string,
  ): Promise<{
    message: string;
    deleted: true;
    user: { id: string; phone: string; role: string };
    deleted_records: DeletedRecords;
  }> {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, phone: true, role: true },
        });
        if (!user) {
          throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        }
        if (!(DEV_PHONES as readonly string[]).includes(user.phone)) {
          throw new ForbiddenException({
            message: 'ONLY_DEVELOPER_ACCOUNTS_CAN_BE_DELETED',
            code: 'NOT_A_DEVELOPER_ACCOUNT',
          });
        }

        const counts: DeletedRecords = {};
        const record = (key: string, count: number): void => {
          if (count > 0) counts[key] = (counts[key] || 0) + count;
        };
        const or = (...conditions: Record<string, unknown>[]): never =>
          ({ OR: conditions }) as never;

        const tripIds = (
          await tx.trip.findMany({
            where: { driverId: userId },
            select: { id: true },
          })
        ).map((trip) => trip.id);
        const bookingIds = (
          await tx.booking.findMany({
            where: or({ passengerId: userId }, { tripId: { in: tripIds } }),
            select: { id: true },
          })
        ).map((booking) => booking.id);
        const rideRequestIds = (
          await tx.rideRequest.findMany({
            where: { passengerId: userId },
            select: { id: true },
          })
        ).map((request) => request.id);
        const supportTicketIds = (
          await tx.supportTicket.findMany({
            where: or({ userId }, { assignedTo: userId }),
            select: { id: true },
          })
        ).map((ticket) => ticket.id);
        const complaintIds = (
          await tx.complaint.findMany({
            where: or(
              { reporterId: userId },
              { accusedId: userId },
              { resolvedBy: userId },
            ),
            select: { id: true },
          })
        ).map((complaint) => complaint.id);

        // Collect uploaded document/vehicle images before deleting their owners.
        const driverProfile = await tx.driverProfile.findUnique({
          where: { driverId: userId },
          select: {
            userIdentificationFront: true,
            userIdentificationBack: true,
            linceseFront: true,
            linceseBack: true,
            personalImageWithId: true,
          },
        });
        const vehicle = await tx.vehicle.findUnique({
          where: { driverId: userId },
          select: {
            registrationDocFront: true,
            registrationDocBack: true,
            vehiclePhotoFront: true,
            vehiclePhotoBack: true,
          },
        });
        const subscriptions = await tx.driverSubscription.findMany({
          where: { driverId: userId },
          select: { screenshotId: true },
        });
        const imageIds = new Set<number>();
        const addImage = (value: unknown): void => {
          if (value !== null && value !== undefined) imageIds.add(Number(value));
        };
        if (driverProfile) {
          addImage(driverProfile.userIdentificationFront);
          addImage(driverProfile.userIdentificationBack);
          addImage(driverProfile.linceseFront);
          addImage(driverProfile.linceseBack);
          addImage(driverProfile.personalImageWithId);
        }
        if (vehicle) {
          addImage(vehicle.registrationDocFront);
          addImage(vehicle.registrationDocBack);
          addImage(vehicle.vehiclePhotoFront);
          addImage(vehicle.vehiclePhotoBack);
        }
        for (const subscription of subscriptions) addImage(subscription.screenshotId);

        // Children first, then their parents. The explicit order also avoids
        // relying on FK actions, because the shared database was built from
        // Sequelize migrations with mixed CASCADE / SET NULL rules.
        record(
          'support_ticket_messages',
          (
            await tx.supportTicketMessage.deleteMany({
              where: or(
                { senderId: userId },
                { ticketId: { in: supportTicketIds } },
              ),
            })
          ).count,
        );
        record(
          'messages',
          (
            await tx.message.deleteMany({
              where: or(
                { senderId: userId },
                { receiverId: userId },
                { bookingId: { in: bookingIds } },
                { supportTicketId: { in: supportTicketIds } },
              ),
            })
          ).count,
        );
        record(
          'ratings',
          (
            await tx.rating.deleteMany({
              where: or(
                { raterId: userId },
                { rateeId: userId },
                { bookingId: { in: bookingIds } },
              ),
            })
          ).count,
        );
        record(
          'delay_events',
          (
            await tx.delayEvent.deleteMany({
              where: or(
                { reportedBy: userId },
                { bookingId: { in: bookingIds } },
              ),
            })
          ).count,
        );
        record(
          'sos_events',
          (
            await tx.sosEvent.deleteMany({
              where: or(
                { userId },
                { acknowledgedBy: userId },
                { resolvedBy: userId },
                { tripId: { in: tripIds } },
                { bookingId: { in: bookingIds } },
              ),
            })
          ).count,
        );
        record(
          'penalties',
          (
            await tx.penalty.deleteMany({
              where: or(
                { userId },
                { issuedBy: userId },
                { complaintId: { in: complaintIds } },
                { tripId: { in: tripIds } },
              ),
            })
          ).count,
        );
        record(
          'complaints',
          (
            await tx.complaint.deleteMany({
              where: { id: { in: complaintIds } },
            })
          ).count,
        );
        record(
          'request_offers',
          (
            await tx.requestOffer.deleteMany({
              where: or(
                { driverId: userId },
                { requestId: { in: rideRequestIds } },
                { tripId: { in: tripIds } },
                { bookingId: { in: bookingIds } },
              ),
            })
          ).count,
        );
        record(
          'bookings',
          (
            await tx.booking.deleteMany({
              where: or(
                { passengerId: userId },
                { tripId: { in: tripIds } },
              ),
            })
          ).count,
        );
        record(
          'ride_requests',
          (
            await tx.rideRequest.deleteMany({
              where: { passengerId: userId },
            })
          ).count,
        );
        record(
          'trip_reminders',
          (
            await tx.tripReminder.deleteMany({
              where: or({ userId }, { tripId: { in: tripIds } }),
            })
          ).count,
        );
        record(
          'trip_locations',
          (
            await tx.tripLocation.deleteMany({
              where: or({ driverId: userId }, { tripId: { in: tripIds } }),
            })
          ).count,
        );
        record(
          'trip_attributes',
          (
            await tx.tripAttribute.deleteMany({
              where: { tripId: { in: tripIds } },
            })
          ).count,
        );
        record(
          'trip_stops',
          (
            await tx.tripStop.deleteMany({
              where: { tripId: { in: tripIds } },
            })
          ).count,
        );
        record(
          'trip_seats',
          (
            await tx.tripSeat.deleteMany({
              where: { tripId: { in: tripIds } },
            })
          ).count,
        );
        record(
          'trips',
          (
            await tx.trip.deleteMany({
              where: { driverId: userId },
            })
          ).count,
        );
        record(
          'driver_subscriptions',
          (
            await tx.driverSubscription.deleteMany({
              where: { driverId: userId },
            })
          ).count,
        );
        record(
          'subscription_transactions',
          (
            await tx.subscriptionTransaction.deleteMany({
              where: { driverId: userId },
            })
          ).count,
        );
        record(
          'document_reviews',
          (
            await tx.documentReview.deleteMany({
              where: or({ driverId: userId }, { decidedBy: userId }),
            })
          ).count,
        );
        record(
          'verification_status_changes',
          (
            await tx.verificationStatusChange.deleteMany({
              where: or({ driverId: userId }, { changedBy: userId }),
            })
          ).count,
        );
        record(
          'favorite_drivers',
          (
            await tx.favoriteDriver.deleteMany({
              where: or({ passengerId: userId }, { driverId: userId }),
            })
          ).count,
        );
        record(
          'favorite_routes',
          (
            await tx.favoriteRoute.deleteMany({
              where: { passengerId: userId },
            })
          ).count,
        );
        record(
          'recent_search',
          (
            await tx.recentSearch.deleteMany({
              where: { passengerId: userId },
            })
          ).count,
        );
        record(
          'notification_settings',
          (
            await tx.notificationSetting.deleteMany({
              where: { userId },
            })
          ).count,
        );
        record(
          'notifications',
          (
            await tx.notification.deleteMany({
              where: { userId },
            })
          ).count,
        );
        record(
          'deletion_requests',
          (
            await tx.deletionRequest.deleteMany({
              where: or({ userId }, { reviewedBy: userId }),
            })
          ).count,
        );
        record(
          'support_tickets',
          (
            await tx.supportTicket.deleteMany({
              where: or({ userId }, { assignedTo: userId }),
            })
          ).count,
        );
        record(
          'vehicles',
          (
            await tx.vehicle.deleteMany({
              where: { driverId: userId },
            })
          ).count,
        );
        record(
          'driver_profiles',
          (
            await tx.driverProfile.deleteMany({
              where: { driverId: userId },
            })
          ).count,
        );
        record(
          'passenger_profiles',
          (
            await tx.passengerProfile.deleteMany({
              where: { passengerId: userId },
            })
          ).count,
        );
        record(
          'audit_logs',
          (
            await tx.auditLog.deleteMany({
              where: or({ performedBy: userId }, { recordId: userId }),
            })
          ).count,
        );

        if (imageIds.size > 0) {
          const ids = [...imageIds];
          const [profiles, vehicles, subscriptionRows] = await Promise.all([
            tx.driverProfile.count({
              where: {
                OR: [
                  { userIdentificationFront: { in: ids } },
                  { userIdentificationBack: { in: ids } },
                  { linceseFront: { in: ids } },
                  { linceseBack: { in: ids } },
                  { personalImageWithId: { in: ids } },
                ],
              },
            }),
            tx.vehicle.count({
              where: {
                OR: [
                  { registrationDocFront: { in: ids } },
                  { registrationDocBack: { in: ids } },
                  { vehiclePhotoFront: { in: ids } },
                  { vehiclePhotoBack: { in: ids } },
                ],
              },
            }),
            tx.driverSubscription.count({
              where: { screenshotId: { in: ids } },
            }),
          ]);
          if (profiles + vehicles + subscriptionRows === 0) {
            record(
              'uploaded_images',
              (
                await tx.uploadedImage.deleteMany({
                  where: { id: { in: ids } },
                })
              ).count,
            );
          }
        }

        record(
          'users',
          (
            await tx.user.deleteMany({
              where: { id: userId },
            })
          ).count,
        );

        return {
          message: 'DEVELOPER_ACCOUNT_DELETED_SUCCESSFULLY',
          deleted: true as const,
          user,
          deleted_records: counts,
        };
      },
      { timeout: 60_000 },
    );

    // Best-effort: make sure the deleted account cannot refresh its session.
    try {
      const keys = await this.redis.keys(`refresh:${userId}:*`);
      if (keys.length > 0) await this.redis.deleteKey(...keys);
    } catch {
      // Redis is not the source of truth; the user row is already gone.
    }

    return result;
  }
}
