const sequelize = require('../config/database');
const User = require('./User');
const UploadedImage = require('./UploadedImage');
const Vehicle = require('./Vehicle');
const DriverProfile = require('./DriverProfile');
const VerificationStatusChange = require('./VerificationStatusChange');
const PassengerProfile = require('./PassengerProfile');
const Trip = require('./Trip');
const TripAttribute = require('./TripAttribute');
const TripStop = require('./TripStop');
const TripSeat = require('./TripSeat');
const Booking = require('./Booking');
const RideRequest = require('./RideRequest');
const RequestOffer = require('./RequestOffer');
const Rating = require('./Rating');
const DelayEvent = require('./DelayEvent');
const Complaint = require('./Complaint');
const Penalty = require('./Penalty');
const SupportTicket = require('./SupportTicket');
const Notification = require('./Notification');
const Message = require('./Message');
const SosEvent = require('./SosEvent');
const TripLocation = require('./TripLocation');
const FavoriteDriver = require('./FavoriteDriver');
const FavoriteRoute = require('./FavoriteRoute');
const AuditLog = require('./AuditLog');
const SubscriptionTransaction = require('./SubscriptionTransaction');
const SubscriptionPlan = require('./SubscriptionPlan');
const DriverSubscription = require('./DriverSubscription');
const PaymentMethod = require('./PaymentMethod');
const NotificationSetting = require('./NotificationSetting');
const SupportTicketMessage = require('./SupportTicketMessage');
const DeletionRequest = require('./DeletionRequest');
const DocumentReview = require('./DocumentReview');

// ===== USER RELATIONS =====
User.hasOne(DriverProfile, { foreignKey: 'driver_id', as: 'driverProfile' });
DriverProfile.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

User.hasOne(PassengerProfile, { foreignKey: 'passenger_id', as: 'passengerProfile' });
PassengerProfile.belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

User.hasOne(Vehicle, { foreignKey: 'driverId', as: 'vehicle' });
Vehicle.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

User.hasMany(VerificationStatusChange, { foreignKey: 'driver_id', as: 'verificationStatusChanges' });
VerificationStatusChange.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });
VerificationStatusChange.belongsTo(User, { foreignKey: 'changed_by', as: 'changedByUser' });

User.hasMany(Trip, { foreignKey: 'driver_id', as: 'trips' });
Trip.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

User.hasMany(Booking, { foreignKey: 'passenger_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

User.hasMany(RideRequest, { foreignKey: 'passenger_id', as: 'rideRequests' });
RideRequest.belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

User.hasMany(RequestOffer, { foreignKey: 'driver_id', as: 'requestOffers' });
RequestOffer.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

User.hasMany(Rating, { foreignKey: 'rater_id', as: 'ratingsGiven' });
Rating.belongsTo(User, { foreignKey: 'rater_id', as: 'rater' });

User.hasMany(Rating, { foreignKey: 'ratee_id', as: 'ratingsReceived' });
Rating.belongsTo(User, { foreignKey: 'ratee_id', as: 'ratee' });

User.hasMany(Complaint, { foreignKey: 'reporter_id', as: 'complaintsReported' });
Complaint.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

User.hasMany(Complaint, { foreignKey: 'accused_id', as: 'complaintsAccused' });
Complaint.belongsTo(User, { foreignKey: 'accused_id', as: 'accused' });

User.hasMany(Penalty, { foreignKey: 'user_id', as: 'penalties' });
Penalty.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(DeletionRequest, { foreignKey: 'user_id', as: 'deletionRequests' });
DeletionRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(SupportTicket, { foreignKey: 'user_id', as: 'supportTickets' });
SupportTicket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

SupportTicket.hasMany(SupportTicketMessage, { foreignKey: 'ticket_id', as: 'messages', onDelete: 'CASCADE' });
SupportTicketMessage.belongsTo(SupportTicket, { foreignKey: 'ticket_id', as: 'ticket' });
SupportTicketMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ===== REALTIME: MESSAGE / SOS / TRIP LOCATION RELATIONS =====
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

Booking.hasMany(Message, { foreignKey: 'booking_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

SupportTicket.hasMany(Message, { foreignKey: 'support_ticket_id', as: 'chatMessages' });
Message.belongsTo(SupportTicket, { foreignKey: 'support_ticket_id', as: 'supportTicket' });

User.hasMany(SosEvent, { foreignKey: 'user_id', as: 'sosEvents' });
SosEvent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Trip.hasMany(SosEvent, { foreignKey: 'trip_id', as: 'sosEvents' });
SosEvent.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

Booking.hasMany(SosEvent, { foreignKey: 'booking_id', as: 'sosEvents' });
SosEvent.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Trip.hasMany(TripLocation, { foreignKey: 'trip_id', as: 'locations' });
TripLocation.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

User.hasMany(TripLocation, { foreignKey: 'driver_id', as: 'tripLocations' });
TripLocation.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

// FavoriteDriver (passenger -> driver)
User.hasMany(FavoriteDriver, { foreignKey: 'passenger_id', as: 'favoriteDrivers' });
FavoriteDriver.belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

User.hasMany(FavoriteDriver, { foreignKey: 'driver_id', as: 'favoritedByPassengers' });
FavoriteDriver.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

// FavoriteRoute
User.hasMany(FavoriteRoute, { foreignKey: 'passenger_id', as: 'favoriteRoutes' });
FavoriteRoute.belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

// ===== VEHICLE RELATIONS =====
Vehicle.hasMany(Trip, { foreignKey: 'vehicle_id', as: 'trips' });
Trip.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

// ===== TRIP RELATIONS =====
Trip.hasMany(TripAttribute, { foreignKey: 'trip_id', as: 'attributes', onDelete: 'CASCADE' });
TripAttribute.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

Trip.hasMany(TripStop, { foreignKey: 'trip_id', as: 'stops', onDelete: 'CASCADE' });
TripStop.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

Trip.hasMany(TripSeat, { foreignKey: 'trip_id', as: 'seats', onDelete: 'CASCADE' });
TripSeat.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

Trip.hasMany(Booking, { foreignKey: 'trip_id', as: 'bookings' });
Booking.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

Trip.hasMany(RequestOffer, { foreignKey: 'trip_id', as: 'offers' });
RequestOffer.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

// ===== BOOKING RELATIONS =====
Booking.hasMany(Rating, { foreignKey: 'booking_id', as: 'ratings' });
Rating.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Booking.hasMany(DelayEvent, { foreignKey: 'booking_id', as: 'delayEvents' });
DelayEvent.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// ===== RIDE REQUEST RELATIONS =====
RideRequest.hasMany(RequestOffer, { foreignKey: 'request_id', as: 'offers' });
RequestOffer.belongsTo(RideRequest, { foreignKey: 'request_id', as: 'rideRequest' });

// ===== COMPLAINT RELATIONS =====
Complaint.hasMany(Penalty, { foreignKey: 'complaint_id', as: 'penalties' });
Penalty.belongsTo(Complaint, { foreignKey: 'complaint_id', as: 'complaint' });

// ===== SUBSCRIPTION RELATIONS =====
User.hasMany(DriverSubscription, { foreignKey: 'driver_id', as: 'driverSubscriptions' });
DriverSubscription.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });
DriverSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
SubscriptionPlan.hasMany(DriverSubscription, { foreignKey: 'plan_id', as: 'subscriptions' });
DriverSubscription.belongsTo(UploadedImage, { foreignKey: 'screenshot_id', as: 'screenshot' });

// ===== NOTIFICATION SETTINGS RELATIONS =====
User.hasMany(NotificationSetting, { foreignKey: 'user_id', as: 'notificationSettings' });
NotificationSetting.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  UploadedImage,
  Vehicle,
  DriverProfile,
  VerificationStatusChange,
  PassengerProfile,
  Trip,
  TripAttribute,
  TripStop,
  TripSeat,
  Booking,
  RideRequest,
  RequestOffer,
  Rating,
  DelayEvent,
  Complaint,
  Penalty,
  SupportTicket,
  Notification,
  Message,
  SosEvent,
  TripLocation,
  FavoriteDriver,
  FavoriteRoute,
  AuditLog,
  SubscriptionTransaction,
  SubscriptionPlan,
  DriverSubscription,
  PaymentMethod,
  NotificationSetting,
  SupportTicketMessage,
  DeletionRequest,
  DocumentReview,
};
