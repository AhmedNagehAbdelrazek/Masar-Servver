"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIO = setIO;
exports.getIO = getIO;
exports.isReady = isReady;
exports.emitToUser = emitToUser;
exports.emitToRole = emitToRole;
exports.emitToRoom = emitToRoom;
exports.isTripMember = isTripMember;
exports.getBookingChatContext = getBookingChatContext;
exports.isTicketMember = isTicketMember;
// @ts-nocheck
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const Models_2 = require("../Models");
const constants_2 = require("../config/constants");
/**
 * Central hub for realtime (Socket.IO) emission. All code that needs to
 * broadcast events goes through this module so rooms stay consistent across
 * the codebase (user:{id}, role:{role}, trip:{id}, booking:{id}, support:{id},
 * admin:{role}).
 */
let io = null;
function setIO(instance) {
    io = instance;
}
function getIO() {
    return io;
}
function isReady() {
    return io !== null;
}
function emitToUser(userId, event, data) {
    if (!io || !userId)
        return false;
    io.to(`user:${userId}`).emit(event, data);
    return true;
}
function emitToRole(role, event, data) {
    if (!io || !role)
        return false;
    io.to(`role:${role}`).emit(event, data);
    return true;
}
function emitToRoom(room, event, data) {
    if (!io || !room)
        return false;
    io.to(room).emit(event, data);
    return true;
}
/**
 * True when the user is a confirmed participant of the trip: either the trip
 * driver or a passenger with a CONFIRMED booking.
 */
async function isTripMember(user, tripId) {
    if (!user || !user.id || !tripId)
        return false;
    const trip = await Models_1.Trip.findByPk(tripId, { attributes: ['id', 'driverId'] });
    if (!trip)
        return false;
    if (trip.driverId === user.id)
        return true;
    const booking = await Models_1.Booking.findOne({
        where: {
            tripId,
            passengerId: user.id,
            status: constants_1.BOOKING_STATUS.CONFIRMED,
        },
        attributes: ['id'],
    });
    return !!booking;
}
/**
 * Booking-chat context: loads the booking with its trip and checks that the
 * user is one of the two chat parties — the booking's passenger or the
 * booking trip's driver. Returns { member, booking, trip }; never throws.
 */
async function getBookingChatContext(user, bookingId) {
    if (!user || !user.id || !bookingId)
        return { member: false, booking: null, trip: null };
    const booking = await Models_1.Booking.findByPk(bookingId, {
        include: [{ model: Models_1.Trip, as: 'trip' }],
    });
    if (!booking || !booking.trip)
        return { member: false, booking, trip: null };
    const isPassenger = booking.passengerId === user.id;
    const isDriver = booking.trip.driverId === user.id;
    return { member: isPassenger || isDriver, booking, trip: booking.trip };
}
/**
 * True when the user is allowed to view/interact with a support ticket: the
 * ticket owner or a support/moderator/admin agent.
 */
async function isTicketMember(user, ticketId) {
    if (!user || !user.id || !ticketId)
        return false;
    if ([constants_2.ROLES.ADMIN, constants_2.ROLES.SUPPORT, constants_2.ROLES.MODERATOR].includes(user.role)) {
        return true;
    }
    const ticket = await Models_2.SupportTicket.findByPk(ticketId, {
        attributes: ['id', 'userId'],
    });
    return !!ticket && ticket.userId === user.id;
}
module.exports = {
    setIO,
    getIO,
    isReady,
    emitToUser,
    emitToRole,
    emitToRoom,
    isTripMember,
    getBookingChatContext,
    isTicketMember,
};
exports.default = module.exports;
//# sourceMappingURL=realtimeService.js.map