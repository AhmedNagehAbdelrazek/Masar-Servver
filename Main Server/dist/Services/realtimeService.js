"use strict";
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
    const { Trip, Booking } = require('../Models');
    const { BOOKING_STATUS } = require('../config/constants');
    const trip = await Trip.findByPk(tripId, { attributes: ['id', 'driverId'] });
    if (!trip)
        return false;
    if (trip.driverId === user.id)
        return true;
    const booking = await Booking.findOne({
        where: {
            tripId,
            passengerId: user.id,
            status: BOOKING_STATUS.CONFIRMED,
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
    const { Booking, Trip } = require('../Models');
    const booking = await Booking.findByPk(bookingId, {
        include: [{ model: Trip, as: 'trip' }],
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
    const { SupportTicket } = require('../Models');
    const { ROLES } = require('../config/constants');
    if ([ROLES.ADMIN, ROLES.SUPPORT, ROLES.MODERATOR].includes(user.role)) {
        return true;
    }
    const ticket = await SupportTicket.findByPk(ticketId, {
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
//# sourceMappingURL=realtimeService.js.map