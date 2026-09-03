import sequelize from '../config/database';
import User from './User';
import UploadedImage from './UploadedImage';
import Vehicle from './Vehicle';
import DriverProfile from './DriverProfile';
import VerificationStatusChange from './VerificationStatusChange';
import PassengerProfile from './PassengerProfile';
import Trip from './Trip';
import TripAttribute from './TripAttribute';
import TripStop from './TripStop';
import TripSeat from './TripSeat';
import Booking from './Booking';
import RideRequest from './RideRequest';
import RequestOffer from './RequestOffer';
import Rating from './Rating';
import DelayEvent from './DelayEvent';
import Complaint from './Complaint';
import Penalty from './Penalty';
import SupportTicket from './SupportTicket';
import Notification from './Notification';
import Message from './Message';
import SosEvent from './SosEvent';
import TripLocation from './TripLocation';
import FavoriteDriver from './FavoriteDriver';
import FavoriteRoute from './FavoriteRoute';
import RecentSearch from './RecentSearch';
import AuditLog from './AuditLog';
import SubscriptionTransaction from './SubscriptionTransaction';
import SubscriptionPlan from './SubscriptionPlan';
import DriverSubscription from './DriverSubscription';
import PaymentMethod from './PaymentMethod';
import NotificationSetting from './NotificationSetting';
import SupportTicketMessage from './SupportTicketMessage';
import DeletionRequest from './DeletionRequest';
import DocumentReview from './DocumentReview';

// ===== USER RELATIONS =====
(User as unknown as { hasOne: (m: unknown, o: unknown) => void }).hasOne(DriverProfile, { foreignKey: 'driverId', as: 'driverProfile' });
(DriverProfile as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

(User as unknown as { hasOne: (m: unknown, o: unknown) => void }).hasOne(PassengerProfile, { foreignKey: 'passenger_id', as: 'passengerProfile' });
(PassengerProfile as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

(User as unknown as { hasOne: (m: unknown, o: unknown) => void }).hasOne(Vehicle, { foreignKey: 'driverId', as: 'vehicle' });
(Vehicle as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(VerificationStatusChange, { foreignKey: 'driver_id', as: 'verificationStatusChanges' });
(VerificationStatusChange as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });
(VerificationStatusChange as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'changed_by', as: 'changedByUser' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Trip, { foreignKey: 'driver_id', as: 'trips' });
(Trip as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Booking, { foreignKey: 'passenger_id', as: 'bookings' });
(Booking as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(RideRequest, { foreignKey: 'passenger_id', as: 'rideRequests' });
(RideRequest as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(RequestOffer, { foreignKey: 'driver_id', as: 'requestOffers' });
(RequestOffer as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Rating, { foreignKey: 'rater_id', as: 'ratingsGiven' });
(Rating as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'rater_id', as: 'rater' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Rating, { foreignKey: 'ratee_id', as: 'ratingsReceived' });
(Rating as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'ratee_id', as: 'ratee' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Complaint, { foreignKey: 'reporter_id', as: 'complaintsReported' });
(Complaint as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Complaint, { foreignKey: 'accused_id', as: 'complaintsAccused' });
(Complaint as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'accused_id', as: 'accused' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Penalty, { foreignKey: 'user_id', as: 'penalties' });
(Penalty as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'user_id', as: 'user' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(DeletionRequest, { foreignKey: 'user_id', as: 'deletionRequests' });
(DeletionRequest as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'user_id', as: 'user' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(SupportTicket, { foreignKey: 'user_id', as: 'supportTickets' });
(SupportTicket as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'user_id', as: 'user' });

(SupportTicket as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(SupportTicketMessage, { foreignKey: 'ticket_id', as: 'messages', onDelete: 'CASCADE' });
(SupportTicketMessage as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(SupportTicket, { foreignKey: 'ticket_id', as: 'ticket' });
(SupportTicketMessage as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
(Notification as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ===== REALTIME: MESSAGE / SOS / TRIP LOCATION RELATIONS =====
(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
(Message as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
(Message as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

(Booking as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Message, { foreignKey: 'booking_id', as: 'messages', onDelete: 'CASCADE' });
(Message as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

(SupportTicket as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Message, { foreignKey: 'support_ticket_id', as: 'chatMessages' });
(Message as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(SupportTicket, { foreignKey: 'support_ticket_id', as: 'supportTicket' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(SosEvent, { foreignKey: 'user_id', as: 'sosEvents' });
(SosEvent as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'user_id', as: 'user' });

(Trip as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(SosEvent, { foreignKey: 'trip_id', as: 'sosEvents' });
(SosEvent as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

(Booking as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(SosEvent, { foreignKey: 'booking_id', as: 'sosEvents' });
(SosEvent as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

(Trip as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(TripLocation, { foreignKey: 'trip_id', as: 'locations' });
(TripLocation as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(TripLocation, { foreignKey: 'driver_id', as: 'tripLocations' });
(TripLocation as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

// FavoriteDriver (passenger -> driver)
(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(FavoriteDriver, { foreignKey: 'passenger_id', as: 'favoriteDrivers' });
(FavoriteDriver as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(FavoriteDriver, { foreignKey: 'driver_id', as: 'favoritedByPassengers' });
(FavoriteDriver as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

// FavoriteRoute
(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(FavoriteRoute, { foreignKey: 'passenger_id', as: 'favoriteRoutes' });
(FavoriteRoute as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

// RecentSearch
(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(RecentSearch, { foreignKey: 'passenger_id', as: 'recentSearches' });
(RecentSearch as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'passenger_id', as: 'passenger' });

// ===== VEHICLE RELATIONS =====
(Vehicle as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Trip, { foreignKey: 'vehicle_id', as: 'trips' });
(Trip as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

// ===== TRIP RELATIONS =====
(Trip as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(TripAttribute, { foreignKey: 'trip_id', as: 'attributes', onDelete: 'CASCADE' });
(TripAttribute as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

(Trip as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(TripStop, { foreignKey: 'trip_id', as: 'stops', onDelete: 'CASCADE' });
(TripStop as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

(Trip as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(TripSeat, { foreignKey: 'trip_id', as: 'seats', onDelete: 'CASCADE' });
(TripSeat as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

(Trip as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Booking, { foreignKey: 'trip_id', as: 'bookings' });
(Booking as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

(Trip as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(RequestOffer, { foreignKey: 'trip_id', as: 'offers' });
(RequestOffer as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

// ===== BOOKING RELATIONS =====
(Booking as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Rating, { foreignKey: 'booking_id', as: 'ratings' });
(Rating as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

(Booking as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(DelayEvent, { foreignKey: 'booking_id', as: 'delayEvents' });
(DelayEvent as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// ===== RIDE REQUEST RELATIONS =====
(RideRequest as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(RequestOffer, { foreignKey: 'request_id', as: 'offers' });
(RequestOffer as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(RideRequest, { foreignKey: 'request_id', as: 'rideRequest' });

// ===== COMPLAINT RELATIONS =====
(Complaint as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(Penalty, { foreignKey: 'complaint_id', as: 'penalties' });
(Penalty as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(Complaint, { foreignKey: 'complaint_id', as: 'complaint' });

// ===== SUBSCRIPTION RELATIONS =====
(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(DriverSubscription, { foreignKey: 'driver_id', as: 'driverSubscriptions' });
(DriverSubscription as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });
(DriverSubscription as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
(SubscriptionPlan as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(DriverSubscription, { foreignKey: 'plan_id', as: 'subscriptions' });
(DriverSubscription as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(UploadedImage, { foreignKey: 'screenshot_id', as: 'screenshot' });

// ===== NOTIFICATION SETTINGS RELATIONS =====
(User as unknown as { hasMany: (m: unknown, o: unknown) => void }).hasMany(NotificationSetting, { foreignKey: 'user_id', as: 'notificationSettings' });
(NotificationSetting as unknown as { belongsTo: (m: unknown, o: unknown) => void }).belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
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
  RecentSearch,
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
export default {
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
  RecentSearch,
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
  RecentSearch,
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
