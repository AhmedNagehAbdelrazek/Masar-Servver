"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportDelay = reportDelay;
exports.listDelays = listDelays;
// @ts-nocheck
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const notificationService_1 = __importDefault(require("./notificationService"));
const auditService_1 = __importDefault(require("./auditService"));
function serializeDelay(delay) {
    return {
        id: delay.id,
        booking_id: delay.bookingId,
        party: delay.party,
        delay_minutes: delay.delayMinutes,
        reason: delay.reason,
        reported_by: delay.reportedBy,
        created_at: delay.createdat || delay.createdAt,
    };
}
async function loadBookingForUser(userId, bookingId) {
    const booking = await Models_1.Booking.findByPk(bookingId, {
        include: [
            {
                model: Models_1.Trip,
                as: 'trip',
                attributes: ['id', 'driverId', 'originCity', 'destinationCity'],
            },
        ],
    });
    if (!booking)
        throw ApiError_1.ApiErrors.notFound('BOOKING_NOT_FOUND');
    const isPassenger = booking.passengerId === userId;
    const isDriver = booking.trip && booking.trip.driverId === userId;
    if (!isPassenger && !isDriver) {
        throw ApiError_1.ApiErrors.forbidden('YOU_ARE_NOT_PART_OF_THIS_BOOKING');
    }
    return { booking, isPassenger, isDriver };
}
async function reportDelay(user, bookingId, payload) {
    const { booking, isPassenger, isDriver } = await loadBookingForUser(user.id, bookingId);
    if (!['driver', 'passenger'].includes(payload.party)) {
        throw ApiError_1.ApiErrors.validation('PARTY_MUST_BE_DRIVER_OR_PASSENGER');
    }
    if (payload.party === 'passenger' && !isPassenger) {
        throw ApiError_1.ApiErrors.forbidden('ONLY_THE_BOOKING_PASSENGER_CAN_REPORT_A_PASSENGER_DELAY');
    }
    if (payload.party === 'driver' && !isDriver) {
        throw ApiError_1.ApiErrors.forbidden('ONLY_THE_TRIP_DRIVER_CAN_REPORT_A_DRIVER_DELAY');
    }
    const delay = await Models_1.DelayEvent.create({
        bookingId,
        party: payload.party,
        delayMinutes: payload.delay_minutes,
        reason: payload.reason || null,
        reportedBy: user.id,
    });
    auditService_1.default.track({
        action: 'delay.reported',
        resourceType: 'delay_event',
        resourceId: delay.id,
        actorId: user.id,
        actorType: isDriver ? 'driver' : 'passenger',
        payload: { booking_id: bookingId, party: payload.party, minutes: payload.delay_minutes },
    });
    const counterpartyId = isDriver ? booking.passengerId : booking.trip.driverId;
    if (counterpartyId) {
        const counterparty = await Models_1.User.findByPk(counterpartyId);
        if (counterparty) {
            await notificationService_1.default.sendToUser(counterparty, 'DELAY_REPORTED', {
                channels: ['in_app', 'push'],
                vars: {
                    delay_minutes: String(payload.delay_minutes),
                    reason: payload.reason || 'Not specified.',
                },
            }).catch((err) => {
                console.warn('[delayService] notification failed:', err.message);
            });
        }
    }
    return serializeDelay(delay);
}
async function listDelays(user, bookingId, filters = {}) {
    await loadBookingForUser(user.id, bookingId);
    const { page, limit, offset } = (0, pagination_1.parsePagination)(filters);
    const where = { bookingId };
    if (filters.party)
        where.party = filters.party;
    const { rows, count } = await Models_1.DelayEvent.findAndCountAll({
        where,
        order: [['createdat', 'DESC']],
        offset,
        limit,
    });
    return {
        data: rows.map(serializeDelay),
        pagination: (0, pagination_1.buildPagination)(count, page, limit),
    };
}
module.exports = { reportDelay, listDelays };
exports.default = module.exports;
//# sourceMappingURL=delayService.js.map