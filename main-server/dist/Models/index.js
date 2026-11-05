"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentReview = exports.DeletionRequest = exports.SupportTicketMessage = exports.NotificationSetting = exports.PaymentMethod = exports.DriverSubscription = exports.SubscriptionPlan = exports.SubscriptionTransaction = exports.AuditLog = exports.RecentSearch = exports.FavoriteRoute = exports.FavoriteDriver = exports.TripLocation = exports.SosEvent = exports.Message = exports.Notification = exports.SupportTicket = exports.Penalty = exports.Complaint = exports.DelayEvent = exports.Rating = exports.RequestOffer = exports.RideRequest = exports.Booking = exports.TripSeat = exports.TripStop = exports.TripAttribute = exports.Trip = exports.PassengerProfile = exports.VerificationStatusChange = exports.DriverProfile = exports.Vehicle = exports.UploadedImage = exports.User = exports.sequelize = void 0;
const database_1 = __importDefault(require("../config/database"));
exports.sequelize = database_1.default;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const UploadedImage_1 = __importDefault(require("./UploadedImage"));
exports.UploadedImage = UploadedImage_1.default;
const Vehicle_1 = __importDefault(require("./Vehicle"));
exports.Vehicle = Vehicle_1.default;
const DriverProfile_1 = __importDefault(require("./DriverProfile"));
exports.DriverProfile = DriverProfile_1.default;
const VerificationStatusChange_1 = __importDefault(require("./VerificationStatusChange"));
exports.VerificationStatusChange = VerificationStatusChange_1.default;
const PassengerProfile_1 = __importDefault(require("./PassengerProfile"));
exports.PassengerProfile = PassengerProfile_1.default;
const Trip_1 = __importDefault(require("./Trip"));
exports.Trip = Trip_1.default;
const TripAttribute_1 = __importDefault(require("./TripAttribute"));
exports.TripAttribute = TripAttribute_1.default;
const TripStop_1 = __importDefault(require("./TripStop"));
exports.TripStop = TripStop_1.default;
const TripSeat_1 = __importDefault(require("./TripSeat"));
exports.TripSeat = TripSeat_1.default;
const Booking_1 = __importDefault(require("./Booking"));
exports.Booking = Booking_1.default;
const RideRequest_1 = __importDefault(require("./RideRequest"));
exports.RideRequest = RideRequest_1.default;
const RequestOffer_1 = __importDefault(require("./RequestOffer"));
exports.RequestOffer = RequestOffer_1.default;
const Rating_1 = __importDefault(require("./Rating"));
exports.Rating = Rating_1.default;
const DelayEvent_1 = __importDefault(require("./DelayEvent"));
exports.DelayEvent = DelayEvent_1.default;
const Complaint_1 = __importDefault(require("./Complaint"));
exports.Complaint = Complaint_1.default;
const Penalty_1 = __importDefault(require("./Penalty"));
exports.Penalty = Penalty_1.default;
const SupportTicket_1 = __importDefault(require("./SupportTicket"));
exports.SupportTicket = SupportTicket_1.default;
const Notification_1 = __importDefault(require("./Notification"));
exports.Notification = Notification_1.default;
const Message_1 = __importDefault(require("./Message"));
exports.Message = Message_1.default;
const SosEvent_1 = __importDefault(require("./SosEvent"));
exports.SosEvent = SosEvent_1.default;
const TripLocation_1 = __importDefault(require("./TripLocation"));
exports.TripLocation = TripLocation_1.default;
const FavoriteDriver_1 = __importDefault(require("./FavoriteDriver"));
exports.FavoriteDriver = FavoriteDriver_1.default;
const FavoriteRoute_1 = __importDefault(require("./FavoriteRoute"));
exports.FavoriteRoute = FavoriteRoute_1.default;
const RecentSearch_1 = __importDefault(require("./RecentSearch"));
exports.RecentSearch = RecentSearch_1.default;
const AuditLog_1 = __importDefault(require("./AuditLog"));
exports.AuditLog = AuditLog_1.default;
const SubscriptionTransaction_1 = __importDefault(require("./SubscriptionTransaction"));
exports.SubscriptionTransaction = SubscriptionTransaction_1.default;
const SubscriptionPlan_1 = __importDefault(require("./SubscriptionPlan"));
exports.SubscriptionPlan = SubscriptionPlan_1.default;
const DriverSubscription_1 = __importDefault(require("./DriverSubscription"));
exports.DriverSubscription = DriverSubscription_1.default;
const PaymentMethod_1 = __importDefault(require("./PaymentMethod"));
exports.PaymentMethod = PaymentMethod_1.default;
const NotificationSetting_1 = __importDefault(require("./NotificationSetting"));
exports.NotificationSetting = NotificationSetting_1.default;
const SupportTicketMessage_1 = __importDefault(require("./SupportTicketMessage"));
exports.SupportTicketMessage = SupportTicketMessage_1.default;
const DeletionRequest_1 = __importDefault(require("./DeletionRequest"));
exports.DeletionRequest = DeletionRequest_1.default;
const DocumentReview_1 = __importDefault(require("./DocumentReview"));
exports.DocumentReview = DocumentReview_1.default;
// ===== USER RELATIONS =====
User_1.default.hasOne(DriverProfile_1.default, { foreignKey: 'driverId', as: 'driverProfile' });
DriverProfile_1.default.belongsTo(User_1.default, { foreignKey: 'driverId', as: 'driver' });
User_1.default.hasOne(PassengerProfile_1.default, { foreignKey: 'passenger_id', as: 'passengerProfile' });
PassengerProfile_1.default.belongsTo(User_1.default, { foreignKey: 'passenger_id', as: 'passenger' });
User_1.default.hasOne(Vehicle_1.default, { foreignKey: 'driverId', as: 'vehicle' });
Vehicle_1.default.belongsTo(User_1.default, { foreignKey: 'driverId', as: 'driver' });
User_1.default.hasMany(VerificationStatusChange_1.default, { foreignKey: 'driver_id', as: 'verificationStatusChanges' });
VerificationStatusChange_1.default.belongsTo(User_1.default, { foreignKey: 'driver_id', as: 'driver' });
VerificationStatusChange_1.default.belongsTo(User_1.default, { foreignKey: 'changed_by', as: 'changedByUser' });
User_1.default.hasMany(Trip_1.default, { foreignKey: 'driver_id', as: 'trips' });
Trip_1.default.belongsTo(User_1.default, { foreignKey: 'driver_id', as: 'driver' });
User_1.default.hasMany(Booking_1.default, { foreignKey: 'passenger_id', as: 'bookings' });
Booking_1.default.belongsTo(User_1.default, { foreignKey: 'passenger_id', as: 'passenger' });
User_1.default.hasMany(RideRequest_1.default, { foreignKey: 'passenger_id', as: 'rideRequests' });
RideRequest_1.default.belongsTo(User_1.default, { foreignKey: 'passenger_id', as: 'passenger' });
User_1.default.hasMany(RequestOffer_1.default, { foreignKey: 'driver_id', as: 'requestOffers' });
RequestOffer_1.default.belongsTo(User_1.default, { foreignKey: 'driver_id', as: 'driver' });
User_1.default.hasMany(Rating_1.default, { foreignKey: 'rater_id', as: 'ratingsGiven' });
Rating_1.default.belongsTo(User_1.default, { foreignKey: 'rater_id', as: 'rater' });
User_1.default.hasMany(Rating_1.default, { foreignKey: 'ratee_id', as: 'ratingsReceived' });
Rating_1.default.belongsTo(User_1.default, { foreignKey: 'ratee_id', as: 'ratee' });
User_1.default.hasMany(Complaint_1.default, { foreignKey: 'reporter_id', as: 'complaintsReported' });
Complaint_1.default.belongsTo(User_1.default, { foreignKey: 'reporter_id', as: 'reporter' });
User_1.default.hasMany(Complaint_1.default, { foreignKey: 'accused_id', as: 'complaintsAccused' });
Complaint_1.default.belongsTo(User_1.default, { foreignKey: 'accused_id', as: 'accused' });
User_1.default.hasMany(Penalty_1.default, { foreignKey: 'user_id', as: 'penalties' });
Penalty_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
User_1.default.hasMany(DeletionRequest_1.default, { foreignKey: 'user_id', as: 'deletionRequests' });
DeletionRequest_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
User_1.default.hasMany(SupportTicket_1.default, { foreignKey: 'user_id', as: 'supportTickets' });
SupportTicket_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
SupportTicket_1.default.hasMany(SupportTicketMessage_1.default, { foreignKey: 'ticket_id', as: 'messages', onDelete: 'CASCADE' });
SupportTicketMessage_1.default.belongsTo(SupportTicket_1.default, { foreignKey: 'ticket_id', as: 'ticket' });
SupportTicketMessage_1.default.belongsTo(User_1.default, { foreignKey: 'sender_id', as: 'sender' });
User_1.default.hasMany(Notification_1.default, { foreignKey: 'user_id', as: 'notifications' });
Notification_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
// ===== REALTIME: MESSAGE / SOS / TRIP LOCATION RELATIONS =====
User_1.default.hasMany(Message_1.default, { foreignKey: 'sender_id', as: 'sentMessages' });
Message_1.default.belongsTo(User_1.default, { foreignKey: 'sender_id', as: 'sender' });
User_1.default.hasMany(Message_1.default, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Message_1.default.belongsTo(User_1.default, { foreignKey: 'receiver_id', as: 'receiver' });
Booking_1.default.hasMany(Message_1.default, { foreignKey: 'booking_id', as: 'messages', onDelete: 'CASCADE' });
Message_1.default.belongsTo(Booking_1.default, { foreignKey: 'booking_id', as: 'booking' });
SupportTicket_1.default.hasMany(Message_1.default, { foreignKey: 'support_ticket_id', as: 'chatMessages' });
Message_1.default.belongsTo(SupportTicket_1.default, { foreignKey: 'support_ticket_id', as: 'supportTicket' });
User_1.default.hasMany(SosEvent_1.default, { foreignKey: 'user_id', as: 'sosEvents' });
SosEvent_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
Trip_1.default.hasMany(SosEvent_1.default, { foreignKey: 'trip_id', as: 'sosEvents' });
SosEvent_1.default.belongsTo(Trip_1.default, { foreignKey: 'trip_id', as: 'trip' });
Booking_1.default.hasMany(SosEvent_1.default, { foreignKey: 'booking_id', as: 'sosEvents' });
SosEvent_1.default.belongsTo(Booking_1.default, { foreignKey: 'booking_id', as: 'booking' });
Trip_1.default.hasMany(TripLocation_1.default, { foreignKey: 'trip_id', as: 'locations' });
TripLocation_1.default.belongsTo(Trip_1.default, { foreignKey: 'trip_id', as: 'trip' });
User_1.default.hasMany(TripLocation_1.default, { foreignKey: 'driver_id', as: 'tripLocations' });
TripLocation_1.default.belongsTo(User_1.default, { foreignKey: 'driver_id', as: 'driver' });
// FavoriteDriver (passenger -> driver)
User_1.default.hasMany(FavoriteDriver_1.default, { foreignKey: 'passenger_id', as: 'favoriteDrivers' });
FavoriteDriver_1.default.belongsTo(User_1.default, { foreignKey: 'passenger_id', as: 'passenger' });
User_1.default.hasMany(FavoriteDriver_1.default, { foreignKey: 'driver_id', as: 'favoritedByPassengers' });
FavoriteDriver_1.default.belongsTo(User_1.default, { foreignKey: 'driver_id', as: 'driver' });
// FavoriteRoute
User_1.default.hasMany(FavoriteRoute_1.default, { foreignKey: 'passenger_id', as: 'favoriteRoutes' });
FavoriteRoute_1.default.belongsTo(User_1.default, { foreignKey: 'passenger_id', as: 'passenger' });
// RecentSearch
User_1.default.hasMany(RecentSearch_1.default, { foreignKey: 'passenger_id', as: 'recentSearches' });
RecentSearch_1.default.belongsTo(User_1.default, { foreignKey: 'passenger_id', as: 'passenger' });
// ===== VEHICLE RELATIONS =====
Vehicle_1.default.hasMany(Trip_1.default, { foreignKey: 'vehicle_id', as: 'trips' });
Trip_1.default.belongsTo(Vehicle_1.default, { foreignKey: 'vehicle_id', as: 'vehicle' });
// ===== TRIP RELATIONS =====
Trip_1.default.hasMany(TripAttribute_1.default, { foreignKey: 'trip_id', as: 'attributes', onDelete: 'CASCADE' });
TripAttribute_1.default.belongsTo(Trip_1.default, { foreignKey: 'trip_id', as: 'trip' });
Trip_1.default.hasMany(TripStop_1.default, { foreignKey: 'trip_id', as: 'stops', onDelete: 'CASCADE' });
TripStop_1.default.belongsTo(Trip_1.default, { foreignKey: 'trip_id', as: 'trip' });
Trip_1.default.hasMany(TripSeat_1.default, { foreignKey: 'trip_id', as: 'seats', onDelete: 'CASCADE' });
TripSeat_1.default.belongsTo(Trip_1.default, { foreignKey: 'trip_id', as: 'trip' });
Trip_1.default.hasMany(Booking_1.default, { foreignKey: 'trip_id', as: 'bookings' });
Booking_1.default.belongsTo(Trip_1.default, { foreignKey: 'trip_id', as: 'trip' });
Trip_1.default.hasMany(RequestOffer_1.default, { foreignKey: 'trip_id', as: 'offers' });
RequestOffer_1.default.belongsTo(Trip_1.default, { foreignKey: 'trip_id', as: 'trip' });
// ===== BOOKING RELATIONS =====
Booking_1.default.hasMany(Rating_1.default, { foreignKey: 'booking_id', as: 'ratings' });
Rating_1.default.belongsTo(Booking_1.default, { foreignKey: 'booking_id', as: 'booking' });
Booking_1.default.hasMany(DelayEvent_1.default, { foreignKey: 'booking_id', as: 'delayEvents' });
DelayEvent_1.default.belongsTo(Booking_1.default, { foreignKey: 'booking_id', as: 'booking' });
// ===== RIDE REQUEST RELATIONS =====
RideRequest_1.default.hasMany(RequestOffer_1.default, { foreignKey: 'request_id', as: 'offers' });
RequestOffer_1.default.belongsTo(RideRequest_1.default, { foreignKey: 'request_id', as: 'rideRequest' });
// ===== COMPLAINT RELATIONS =====
Complaint_1.default.hasMany(Penalty_1.default, { foreignKey: 'complaint_id', as: 'penalties' });
Penalty_1.default.belongsTo(Complaint_1.default, { foreignKey: 'complaint_id', as: 'complaint' });
// ===== SUBSCRIPTION RELATIONS =====
User_1.default.hasMany(DriverSubscription_1.default, { foreignKey: 'driver_id', as: 'driverSubscriptions' });
DriverSubscription_1.default.belongsTo(User_1.default, { foreignKey: 'driver_id', as: 'driver' });
DriverSubscription_1.default.belongsTo(SubscriptionPlan_1.default, { foreignKey: 'plan_id', as: 'plan' });
SubscriptionPlan_1.default.hasMany(DriverSubscription_1.default, { foreignKey: 'plan_id', as: 'subscriptions' });
DriverSubscription_1.default.belongsTo(UploadedImage_1.default, { foreignKey: 'screenshot_id', as: 'screenshot' });
// ===== NOTIFICATION SETTINGS RELATIONS =====
User_1.default.hasMany(NotificationSetting_1.default, { foreignKey: 'user_id', as: 'notificationSettings' });
NotificationSetting_1.default.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'user' });
exports.default = {
    sequelize: database_1.default,
    User: User_1.default,
    UploadedImage: UploadedImage_1.default,
    Vehicle: Vehicle_1.default,
    DriverProfile: DriverProfile_1.default,
    VerificationStatusChange: VerificationStatusChange_1.default,
    PassengerProfile: PassengerProfile_1.default,
    Trip: Trip_1.default,
    TripAttribute: TripAttribute_1.default,
    TripStop: TripStop_1.default,
    TripSeat: TripSeat_1.default,
    Booking: Booking_1.default,
    RideRequest: RideRequest_1.default,
    RequestOffer: RequestOffer_1.default,
    Rating: Rating_1.default,
    DelayEvent: DelayEvent_1.default,
    Complaint: Complaint_1.default,
    Penalty: Penalty_1.default,
    SupportTicket: SupportTicket_1.default,
    Notification: Notification_1.default,
    Message: Message_1.default,
    SosEvent: SosEvent_1.default,
    TripLocation: TripLocation_1.default,
    FavoriteDriver: FavoriteDriver_1.default,
    FavoriteRoute: FavoriteRoute_1.default,
    RecentSearch: RecentSearch_1.default,
    AuditLog: AuditLog_1.default,
    SubscriptionTransaction: SubscriptionTransaction_1.default,
    SubscriptionPlan: SubscriptionPlan_1.default,
    DriverSubscription: DriverSubscription_1.default,
    PaymentMethod: PaymentMethod_1.default,
    NotificationSetting: NotificationSetting_1.default,
    SupportTicketMessage: SupportTicketMessage_1.default,
    DeletionRequest: DeletionRequest_1.default,
    DocumentReview: DocumentReview_1.default,
};
module.exports = {
    sequelize: database_1.default,
    User: User_1.default,
    UploadedImage: UploadedImage_1.default,
    Vehicle: Vehicle_1.default,
    DriverProfile: DriverProfile_1.default,
    VerificationStatusChange: VerificationStatusChange_1.default,
    PassengerProfile: PassengerProfile_1.default,
    Trip: Trip_1.default,
    TripAttribute: TripAttribute_1.default,
    TripStop: TripStop_1.default,
    TripSeat: TripSeat_1.default,
    Booking: Booking_1.default,
    RideRequest: RideRequest_1.default,
    RequestOffer: RequestOffer_1.default,
    Rating: Rating_1.default,
    DelayEvent: DelayEvent_1.default,
    Complaint: Complaint_1.default,
    Penalty: Penalty_1.default,
    SupportTicket: SupportTicket_1.default,
    Notification: Notification_1.default,
    Message: Message_1.default,
    SosEvent: SosEvent_1.default,
    TripLocation: TripLocation_1.default,
    FavoriteDriver: FavoriteDriver_1.default,
    FavoriteRoute: FavoriteRoute_1.default,
    RecentSearch: RecentSearch_1.default,
    AuditLog: AuditLog_1.default,
    SubscriptionTransaction: SubscriptionTransaction_1.default,
    SubscriptionPlan: SubscriptionPlan_1.default,
    DriverSubscription: DriverSubscription_1.default,
    PaymentMethod: PaymentMethod_1.default,
    NotificationSetting: NotificationSetting_1.default,
    SupportTicketMessage: SupportTicketMessage_1.default,
    DeletionRequest: DeletionRequest_1.default,
    DocumentReview: DocumentReview_1.default,
};
//# sourceMappingURL=index.js.map