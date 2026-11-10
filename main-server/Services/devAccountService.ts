import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import { redis } from '../config/redis';
import { DEV_PHONES } from '../config/constants';
import { ApiErrors } from '../utils/ApiError';
import {
  AuditLog,
  Booking,
  Complaint,
  DelayEvent,
  DeletionRequest,
  DocumentReview,
  DriverProfile,
  DriverSubscription,
  FavoriteDriver,
  FavoriteRoute,
  Message,
  Notification,
  NotificationSetting,
  PassengerProfile,
  Penalty,
  Rating,
  RecentSearch,
  RequestOffer,
  RideRequest,
  SosEvent,
  SubscriptionTransaction,
  SupportTicket,
  SupportTicketMessage,
  Trip,
  TripAttribute,
  TripLocation,
  TripReminder,
  TripSeat,
  TripStop,
  UploadedImage,
  User,
  Vehicle,
  VerificationStatusChange,
} from '../Models';

type DeletedRecords = Record<string, number>;

interface IdRow {
  id: string;
}

function addCount(counts: DeletedRecords, key: string, count: number): void {
  if (count > 0) counts[key] = (counts[key] || 0) + count;
}

/**
 * Permanently deletes a configured developer account and every row that
 * belongs to its history. Only phones in DEV_PHONES are eligible; the caller
 * is expected to be an authenticated admin (route guard).
 *
 * Everything runs in one transaction so a partial purge can never leave the
 * account alive with its trips/bookings already removed.
 */
export async function permanentlyDeleteDevUser(
  userId: string,
  _actorId?: string,
): Promise<{
  message: string;
  deleted: true;
  user: { id: string; phone: string; role: string };
  deleted_records: DeletedRecords;
}> {
  const result = await sequelize.transaction(async (transaction: Transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');

    if (!DEV_PHONES.includes(user.phone)) {
      throw ApiErrors.custom(
        'ONLY_DEVELOPER_ACCOUNTS_CAN_BE_DELETED',
        403,
        'NOT_A_DEVELOPER_ACCOUNT',
      );
    }

    const counts: DeletedRecords = {};

    const findIds = async (model: unknown, where: Record<string, unknown>): Promise<string[]> => {
      const rows = await (model as unknown as {
        findAll: (options: unknown) => Promise<IdRow[]>;
      }).findAll({ where, attributes: ['id'], transaction });
      return rows.map((row) => row.id);
    };

    const remove = async (
      key: string,
      model: unknown,
      where: Record<string, unknown>,
    ): Promise<void> => {
      const count = await (model as unknown as {
        destroy: (options: unknown) => Promise<number>;
      }).destroy({ where, transaction });
      addCount(counts, key, count);
    };

    const tripIds = await findIds(Trip, { driverId: userId });
    const bookingWhere: Record<string, unknown>[] = [{ passengerId: userId }];
    if (tripIds.length) bookingWhere.push({ tripId: { [Op.in]: tripIds } });
    const bookingIds = await findIds(Booking, { [Op.or]: bookingWhere });

    const rideRequestIds = await findIds(RideRequest, { passengerId: userId });

    const supportTicketIds = await findIds(SupportTicket, {
      [Op.or]: [{ userId }, { assignedTo: userId }],
    });

    const complaintIds = await findIds(Complaint, {
      [Op.or]: [{ reporterId: userId }, { accusedId: userId }, { resolvedBy: userId }],
    });

    // Collect uploaded document/vehicle images before deleting their owners.
    const driverProfile = await DriverProfile.findOne({
      where: { driverId: userId },
      transaction,
    });
    const vehicle = await Vehicle.findOne({ where: { driverId: userId }, transaction });
    const subscriptions = await DriverSubscription.findAll({
      where: { driverId: userId },
      attributes: ['screenshotId'],
      transaction,
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

    const messageWhere: Record<string, unknown>[] = [
      { senderId: userId },
      { receiverId: userId },
    ];
    if (bookingIds.length) messageWhere.push({ bookingId: { [Op.in]: bookingIds } });
    if (supportTicketIds.length) {
      messageWhere.push({ supportTicketId: { [Op.in]: supportTicketIds } });
    }

    const supportMessageWhere: Record<string, unknown>[] = [{ senderId: userId }];
    if (supportTicketIds.length) {
      supportMessageWhere.push({ ticketId: { [Op.in]: supportTicketIds } });
    }

    const ratingWhere: Record<string, unknown>[] = [
      { raterId: userId },
      { rateeId: userId },
    ];
    if (bookingIds.length) ratingWhere.push({ bookingId: { [Op.in]: bookingIds } });

    const delayWhere: Record<string, unknown>[] = [{ reportedBy: userId }];
    if (bookingIds.length) delayWhere.push({ bookingId: { [Op.in]: bookingIds } });

    const sosWhere: Record<string, unknown>[] = [
      { userId },
      { acknowledgedBy: userId },
      { resolvedBy: userId },
    ];
    if (tripIds.length) sosWhere.push({ tripId: { [Op.in]: tripIds } });
    if (bookingIds.length) sosWhere.push({ bookingId: { [Op.in]: bookingIds } });

    const penaltyWhere: Record<string, unknown>[] = [
      { userId },
      { issuedBy: userId },
    ];
    if (complaintIds.length) penaltyWhere.push({ complaintId: { [Op.in]: complaintIds } });
    if (tripIds.length) penaltyWhere.push({ tripId: { [Op.in]: tripIds } });

    const offerWhere: Record<string, unknown>[] = [{ driverId: userId }];
    if (rideRequestIds.length) offerWhere.push({ requestId: { [Op.in]: rideRequestIds } });
    if (tripIds.length) offerWhere.push({ tripId: { [Op.in]: tripIds } });
    if (bookingIds.length) offerWhere.push({ bookingId: { [Op.in]: bookingIds } });

    const bookingDeleteWhere: Record<string, unknown>[] = [{ passengerId: userId }];
    if (tripIds.length) bookingDeleteWhere.push({ tripId: { [Op.in]: tripIds } });

    const tripChildWhere = tripIds.length ? { tripId: { [Op.in]: tripIds } } : null;
    const reminderWhere: Record<string, unknown>[] = [{ userId }];
    if (tripIds.length) reminderWhere.push({ tripId: { [Op.in]: tripIds } });
    const locationWhere: Record<string, unknown>[] = [{ driverId: userId }];
    if (tripIds.length) locationWhere.push({ tripId: { [Op.in]: tripIds } });

    // Children first, then their parents. The explicit order also avoids
    // relying on FK actions, because the shared database was built from
    // Sequelize migrations with mixed CASCADE / SET NULL rules.
    await remove('support_ticket_messages', SupportTicketMessage, {
      [Op.or]: supportMessageWhere,
    });
    await remove('messages', Message, { [Op.or]: messageWhere });
    await remove('ratings', Rating, { [Op.or]: ratingWhere });
    await remove('delay_events', DelayEvent, { [Op.or]: delayWhere });
    await remove('sos_events', SosEvent, { [Op.or]: sosWhere });
    await remove('penalties', Penalty, { [Op.or]: penaltyWhere });
    if (complaintIds.length) {
      await remove('complaints', Complaint, { id: { [Op.in]: complaintIds } });
    }
    await remove('request_offers', RequestOffer, { [Op.or]: offerWhere });
    await remove('bookings', Booking, { [Op.or]: bookingDeleteWhere });
    await remove('ride_requests', RideRequest, { passengerId: userId });
    await remove('trip_reminders', TripReminder, { [Op.or]: reminderWhere });
    await remove('trip_locations', TripLocation, { [Op.or]: locationWhere });
    if (tripChildWhere) {
      await remove('trip_attributes', TripAttribute, tripChildWhere);
      await remove('trip_stops', TripStop, tripChildWhere);
      await remove('trip_seats', TripSeat, tripChildWhere);
    }
    await remove('trips', Trip, { driverId: userId });
    await remove('driver_subscriptions', DriverSubscription, { driverId: userId });
    await remove('subscription_transactions', SubscriptionTransaction, { driverId: userId });
    await remove('document_reviews', DocumentReview, {
      [Op.or]: [{ driverId: userId }, { decidedBy: userId }],
    });
    await remove('verification_status_changes', VerificationStatusChange, {
      [Op.or]: [{ driverId: userId }, { changedBy: userId }],
    });
    await remove('favorite_drivers', FavoriteDriver, {
      [Op.or]: [{ passengerId: userId }, { driverId: userId }],
    });
    await remove('favorite_routes', FavoriteRoute, { passengerId: userId });
    await remove('recent_search', RecentSearch, { passengerId: userId });
    await remove('notification_settings', NotificationSetting, { userId });
    await remove('notifications', Notification, { userId });
    await remove('deletion_requests', DeletionRequest, {
      [Op.or]: [{ userId }, { reviewedBy: userId }],
    });
    await remove('support_tickets', SupportTicket, {
      [Op.or]: [{ userId }, { assignedTo: userId }],
    });
    await remove('vehicles', Vehicle, { driverId: userId });
    await remove('driver_profiles', DriverProfile, { driverId: userId });
    await remove('passenger_profiles', PassengerProfile, { passengerId: userId });
    await remove('audit_logs', AuditLog, {
      [Op.or]: [{ performedBy: userId }, { recordId: userId }],
    });
    if (imageIds.size > 0) {
      const ids = [...imageIds];
      const [profileRefs, vehicleRefs, subscriptionRefs] = await Promise.all([
        DriverProfile.count({
          where: {
            [Op.or]: [
              { userIdentificationFront: { [Op.in]: ids } },
              { userIdentificationBack: { [Op.in]: ids } },
              { linceseFront: { [Op.in]: ids } },
              { linceseBack: { [Op.in]: ids } },
              { personalImageWithId: { [Op.in]: ids } },
            ],
          },
          transaction,
        }),
        Vehicle.count({
          where: {
            [Op.or]: [
              { registrationDocFront: { [Op.in]: ids } },
              { registrationDocBack: { [Op.in]: ids } },
              { vehiclePhotoFront: { [Op.in]: ids } },
              { vehiclePhotoBack: { [Op.in]: ids } },
            ],
          },
          transaction,
        }),
        DriverSubscription.count({
          where: { screenshotId: { [Op.in]: ids } },
          transaction,
        }),
      ]);
      if (profileRefs + vehicleRefs + subscriptionRefs === 0) {
        await remove('uploaded_images', UploadedImage, {
          id: { [Op.in]: ids },
        });
      }
    }

    const deletedUser = await (User as unknown as {
      destroy: (options: unknown) => Promise<number>;
    }).destroy({ where: { id: userId }, transaction });
    addCount(counts, 'users', deletedUser);

    return {
      message: 'DEVELOPER_ACCOUNT_DELETED_SUCCESSFULLY',
      deleted: true as const,
      user: { id: user.id, phone: user.phone, role: user.role },
      deleted_records: counts,
    };
  });

  // Best-effort: make sure the deleted account cannot refresh its session.
  try {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err: unknown) {
    console.warn(
      `[devAccountService] Could not revoke refresh tokens for ${userId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  return result;
}

export default { permanentlyDeleteDevUser };
