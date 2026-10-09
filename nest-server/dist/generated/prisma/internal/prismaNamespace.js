import * as runtime from "@prisma/client/runtime/client";
export const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export const PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export const PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export const PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export const PrismaClientValidationError = runtime.PrismaClientValidationError;
export const sql = runtime.sqltag;
export const empty = runtime.empty;
export const join = runtime.join;
export const raw = runtime.raw;
export const Sql = runtime.Sql;
export const Decimal = runtime.Decimal;
export const getExtensionContext = runtime.Extensions.getExtensionContext;
export const prismaVersion = {
    client: "7.10.0",
    engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    User: 'User',
    DriverProfile: 'DriverProfile',
    Vehicle: 'Vehicle',
    PassengerProfile: 'PassengerProfile',
    Trip: 'Trip',
    TripAttribute: 'TripAttribute',
    TripStop: 'TripStop',
    TripSeat: 'TripSeat',
    TripLocation: 'TripLocation',
    Booking: 'Booking',
    RideRequest: 'RideRequest',
    RequestOffer: 'RequestOffer',
    Rating: 'Rating',
    DelayEvent: 'DelayEvent',
    Complaint: 'Complaint',
    Penalty: 'Penalty',
    SupportTicket: 'SupportTicket',
    SupportTicketMessage: 'SupportTicketMessage',
    Message: 'Message',
    SosEvent: 'SosEvent',
    Notification: 'Notification',
    NotificationSetting: 'NotificationSetting',
    FavoriteDriver: 'FavoriteDriver',
    FavoriteRoute: 'FavoriteRoute',
    RecentSearch: 'RecentSearch',
    AuditLog: 'AuditLog',
    SubscriptionPlan: 'SubscriptionPlan',
    DriverSubscription: 'DriverSubscription',
    SubscriptionTransaction: 'SubscriptionTransaction',
    PaymentMethod: 'PaymentMethod',
    UploadedImage: 'UploadedImage',
    DeletionRequest: 'DeletionRequest',
    DocumentReview: 'DocumentReview',
    VerificationStatusChange: 'VerificationStatusChange'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const UserScalarFieldEnum = {
    id: 'id',
    fullName: 'fullName',
    displayName: 'displayName',
    countryCode: 'countryCode',
    phone: 'phone',
    email: 'email',
    role: 'role',
    gender: 'gender',
    passwordHash: 'passwordHash',
    age: 'age',
    avatarUrl: 'avatarUrl',
    isVerified: 'isVerified',
    verificationStatus: 'verificationStatus',
    verificationSubmittedAt: 'verificationSubmittedAt',
    verificationRejectedAt: 'verificationRejectedAt',
    verificationRejectionReason: 'verificationRejectionReason',
    verificationRejectionFields: 'verificationRejectionFields',
    avgRating: 'avgRating',
    strikes: 'strikes',
    locale: 'locale',
    status: 'status',
    fcmToken: 'fcmToken',
    lastLoginAt: 'lastLoginAt',
    totalBalance: 'totalBalance',
    isInDebt: 'isInDebt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const DriverProfileScalarFieldEnum = {
    id: 'id',
    driverId: 'driverId',
    userIdentificationFront: 'userIdentificationFront',
    userIdentificationBack: 'userIdentificationBack',
    linceseFront: 'linceseFront',
    linceseBack: 'linceseBack',
    personalImageWithId: 'personalImageWithId',
    nationalID: 'nationalID',
    idVerified: 'idVerified',
    licenseNumber: 'licenseNumber',
    licenseExpiry: 'licenseExpiry',
    subscriptionTier: 'subscriptionTier',
    subscriptionExpiresAt: 'subscriptionExpiresAt',
    totalTrips: 'totalTrips',
    totalEarnings: 'totalEarnings',
    responseRate: 'responseRate',
    punctualityRate: 'punctualityRate',
    professionalDriver: 'professionalDriver',
    bio: 'bio',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const VehicleScalarFieldEnum = {
    id: 'id',
    driverId: 'driverId',
    manufacturer: 'manufacturer',
    model: 'model',
    vehicleType: 'vehicleType',
    modelYear: 'modelYear',
    plateNumber: 'plateNumber',
    codeNumber: 'codeNumber',
    color: 'color',
    seats: 'seats',
    registrationDocFront: 'registrationDocFront',
    registrationDocBack: 'registrationDocBack',
    vehiclePhotoFront: 'vehiclePhotoFront',
    vehiclePhotoBack: 'vehiclePhotoBack',
    isVerified: 'isVerified',
    verificationNotes: 'verificationNotes',
    verificationRejectionReason: 'verificationRejectionReason',
    verificationRejectedAt: 'verificationRejectedAt',
    verifiedBy: 'verifiedBy',
    verifiedAt: 'verifiedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const PassengerProfileScalarFieldEnum = {
    id: 'id',
    passengerId: 'passengerId',
    preferredGender: 'preferredGender',
    smokingPreference: 'smokingPreference',
    savedRoutes: 'savedRoutes',
    nationalID: 'nationalID',
    homeAddress: 'homeAddress',
    emergencyContacts: 'emergencyContacts',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TripScalarFieldEnum = {
    id: 'id',
    driverId: 'driverId',
    vehicleId: 'vehicleId',
    originCity: 'originCity',
    originArea: 'originArea',
    originAddress: 'originAddress',
    originLat: 'originLat',
    originLng: 'originLng',
    destinationCity: 'destinationCity',
    destinationArea: 'destinationArea',
    destinationAddress: 'destinationAddress',
    destinationLat: 'destinationLat',
    destinationLng: 'destinationLng',
    departureTime: 'departureTime',
    arrivalTime: 'arrivalTime',
    totalSeats: 'totalSeats',
    availableSeats: 'availableSeats',
    farePerSeat: 'farePerSeat',
    totalProfit: 'totalProfit',
    currency: 'currency',
    isRecurring: 'isRecurring',
    recurrencePattern: 'recurrencePattern',
    recurrenceDays: 'recurrenceDays',
    recurrenceEndDate: 'recurrenceEndDate',
    genderPreference: 'genderPreference',
    driverInstructions: 'driverInstructions',
    additionalInstructions: 'additionalInstructions',
    status: 'status',
    isFeatured: 'isFeatured',
    featuredUntil: 'featuredUntil',
    isBlockedByBalance: 'isBlockedByBalance',
    isModerated: 'isModerated',
    moderationReason: 'moderationReason',
    moderatedBy: 'moderatedBy',
    routePolyline: 'routePolyline',
    routeDistanceM: 'routeDistanceM',
    routeDurationS: 'routeDurationS',
    routeStatus: 'routeStatus',
    routeComputedAt: 'routeComputedAt',
    routeVersion: 'routeVersion',
    actualPathPolyline: 'actualPathPolyline',
    actualDistanceM: 'actualDistanceM',
    actualDurationS: 'actualDurationS',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const TripAttributeScalarFieldEnum = {
    id: 'id',
    tripId: 'tripId',
    attrKey: 'attrKey',
    attrValue: 'attrValue'
};
export const TripStopScalarFieldEnum = {
    id: 'id',
    tripId: 'tripId',
    stopOrder: 'stopOrder',
    stopName: 'stopName',
    city: 'city',
    address: 'address',
    lat: 'lat',
    lng: 'lng',
    stopLat: 'stopLat',
    stopLng: 'stopLng',
    stopType: 'stopType',
    estimatedArrival: 'estimatedArrival',
    createdAt: 'createdAt'
};
export const TripSeatScalarFieldEnum = {
    id: 'id',
    tripId: 'tripId',
    seatNumber: 'seatNumber',
    seatType: 'seatType',
    wasAvailable: 'wasAvailable',
    createdAt: 'createdAt'
};
export const TripLocationScalarFieldEnum = {
    id: 'id',
    tripId: 'tripId',
    driverId: 'driverId',
    lat: 'lat',
    lng: 'lng',
    speed: 'speed',
    heading: 'heading',
    occurrenceDate: 'occurrenceDate',
    createdAt: 'createdAt'
};
export const BookingScalarFieldEnum = {
    id: 'id',
    tripId: 'tripId',
    passengerId: 'passengerId',
    seatNumber: 'seatNumber',
    seatNumbers: 'seatNumbers',
    seatsBooked: 'seatsBooked',
    agreedFare: 'agreedFare',
    currency: 'currency',
    pickupPlace: 'pickupPlace',
    pickupLat: 'pickupLat',
    pickupLng: 'pickupLng',
    pickupOrder: 'pickupOrder',
    pickupType: 'pickupType',
    pickupStopId: 'pickupStopId',
    pickupLabel: 'pickupLabel',
    pickupCity: 'pickupCity',
    pickupArea: 'pickupArea',
    detourSeconds: 'detourSeconds',
    pickupStatus: 'pickupStatus',
    arrivedAt: 'arrivedAt',
    pickedUpAt: 'pickedUpAt',
    dropoffPlace: 'dropoffPlace',
    dropoffLat: 'dropoffLat',
    dropoffLng: 'dropoffLng',
    dropoffDeadline: 'dropoffDeadline',
    dropoffOrder: 'dropoffOrder',
    status: 'status',
    referenceCode: 'referenceCode',
    cancellationReason: 'cancellationReason',
    cancelledBy: 'cancelledBy',
    cancelledAt: 'cancelledAt',
    paymentStatus: 'paymentStatus',
    completedAt: 'completedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RideRequestScalarFieldEnum = {
    id: 'id',
    passengerId: 'passengerId',
    originPlace: 'originPlace',
    originCity: 'originCity',
    originLat: 'originLat',
    originLng: 'originLng',
    originTime: 'originTime',
    destinationPlace: 'destinationPlace',
    destinationCity: 'destinationCity',
    destinationLat: 'destinationLat',
    destinationLng: 'destinationLng',
    arrivalDeadline: 'arrivalDeadline',
    seatsNeeded: 'seatsNeeded',
    maxBudget: 'maxBudget',
    currency: 'currency',
    attributesPreferred: 'attributesPreferred',
    note: 'note',
    status: 'status',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RequestOfferScalarFieldEnum = {
    id: 'id',
    requestId: 'requestId',
    driverId: 'driverId',
    tripId: 'tripId',
    offeredFare: 'offeredFare',
    message: 'message',
    status: 'status',
    agreedFare: 'agreedFare',
    bookingId: 'bookingId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RatingScalarFieldEnum = {
    id: 'id',
    bookingId: 'bookingId',
    raterId: 'raterId',
    rateeId: 'rateeId',
    stars: 'stars',
    wasLate: 'wasLate',
    lateMinutes: 'lateMinutes',
    review: 'review',
    tags: 'tags',
    isVisible: 'isVisible',
    createdAt: 'createdAt'
};
export const DelayEventScalarFieldEnum = {
    id: 'id',
    bookingId: 'bookingId',
    party: 'party',
    delayMinutes: 'delayMinutes',
    reason: 'reason',
    reportedBy: 'reportedBy',
    createdAt: 'createdAt'
};
export const ComplaintScalarFieldEnum = {
    id: 'id',
    bookingId: 'bookingId',
    reporterId: 'reporterId',
    accusedId: 'accusedId',
    category: 'category',
    description: 'description',
    evidenceUrls: 'evidenceUrls',
    status: 'status',
    resolution: 'resolution',
    resolvedBy: 'resolvedBy',
    resolvedAt: 'resolvedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const PenaltyScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    complaintId: 'complaintId',
    tripId: 'tripId',
    type: 'type',
    penaltyType: 'penaltyType',
    severity: 'severity',
    reason: 'reason',
    details: 'details',
    startsAt: 'startsAt',
    endsAt: 'endsAt',
    issuedBy: 'issuedBy',
    isAppealed: 'isAppealed',
    appealReason: 'appealReason',
    appealResolvedAt: 'appealResolvedAt',
    createdAt: 'createdAt'
};
export const SupportTicketScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    category: 'category',
    subject: 'subject',
    description: 'description',
    priority: 'priority',
    status: 'status',
    assignedTo: 'assignedTo',
    referenceCode: 'referenceCode',
    bookingId: 'bookingId',
    tripId: 'tripId',
    resolutionNotes: 'resolutionNotes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const SupportTicketMessageScalarFieldEnum = {
    id: 'id',
    ticketId: 'ticketId',
    senderId: 'senderId',
    message: 'message',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const MessageScalarFieldEnum = {
    id: 'id',
    senderId: 'senderId',
    receiverId: 'receiverId',
    bookingId: 'bookingId',
    supportTicketId: 'supportTicketId',
    message: 'message',
    messageType: 'messageType',
    isRead: 'isRead',
    readAt: 'readAt',
    createdAt: 'createdAt'
};
export const SosEventScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    tripId: 'tripId',
    bookingId: 'bookingId',
    lat: 'lat',
    lng: 'lng',
    urgency: 'urgency',
    status: 'status',
    escalationLevel: 'escalationLevel',
    lastAlertAt: 'lastAlertAt',
    acknowledgedBy: 'acknowledgedBy',
    acknowledgedAt: 'acknowledgedAt',
    resolvedBy: 'resolvedBy',
    resolutionNote: 'resolutionNote',
    resolvedAt: 'resolvedAt',
    createdAt: 'createdAt'
};
export const NotificationScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    type: 'type',
    title: 'title',
    body: 'body',
    data: 'data',
    isRead: 'isRead',
    sentVia: 'sentVia',
    createdAt: 'createdAt'
};
export const NotificationSettingScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    notificationType: 'notificationType',
    enabledInApp: 'enabledInApp',
    enabledPush: 'enabledPush',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const FavoriteDriverScalarFieldEnum = {
    id: 'id',
    passengerId: 'passengerId',
    driverId: 'driverId',
    createdAt: 'createdAt'
};
export const FavoriteRouteScalarFieldEnum = {
    id: 'id',
    passengerId: 'passengerId',
    originCity: 'originCity',
    destinationCity: 'destinationCity',
    label: 'label',
    createdAt: 'createdAt'
};
export const RecentSearchScalarFieldEnum = {
    id: 'id',
    passengerId: 'passengerId',
    originCity: 'originCity',
    destinationCity: 'destinationCity',
    searchedOn: 'searchedOn',
    createdAt: 'createdAt'
};
export const AuditLogScalarFieldEnum = {
    id: 'id',
    tableName: 'tableName',
    recordId: 'recordId',
    action: 'action',
    oldData: 'oldData',
    newData: 'newData',
    performedBy: 'performedBy',
    ipAddress: 'ipAddress',
    userAgent: 'userAgent',
    createdAt: 'createdAt'
};
export const SubscriptionPlanScalarFieldEnum = {
    id: 'id',
    name: 'name',
    periodDays: 'periodDays',
    percentageCut: 'percentageCut',
    cost: 'cost',
    status: 'status',
    features: 'features',
    isFree: 'isFree',
    freeOffer: 'freeOffer',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const DriverSubscriptionScalarFieldEnum = {
    id: 'id',
    driverId: 'driverId',
    planId: 'planId',
    planName: 'planName',
    planPeriodDays: 'planPeriodDays',
    planPercentageCut: 'planPercentageCut',
    planCost: 'planCost',
    balance: 'balance',
    screenshotId: 'screenshotId',
    paymentMethod: 'paymentMethod',
    adminNotes: 'adminNotes',
    status: 'status',
    approvedAt: 'approvedAt',
    activatedAt: 'activatedAt',
    expiresAt: 'expiresAt',
    freeTripsUsed: 'freeTripsUsed',
    freeOffer: 'freeOffer',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const SubscriptionTransactionScalarFieldEnum = {
    id: 'id',
    driverId: 'driverId',
    tier: 'tier',
    amount: 'amount',
    currency: 'currency',
    paymentMethod: 'paymentMethod',
    status: 'status',
    providerTransactionId: 'providerTransactionId',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
};
export const PaymentMethodScalarFieldEnum = {
    id: 'id',
    name: 'name',
    accountNumber: 'accountNumber',
    type: 'type',
    email: 'email',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const UploadedImageScalarFieldEnum = {
    id: 'id',
    hash: 'hash',
    url: 'url',
    filename: 'filename',
    mimetype: 'mimetype',
    size: 'size',
    provider: 'provider',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const DeletionRequestScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    reason: 'reason',
    status: 'status',
    estimatedCompletion: 'estimatedCompletion',
    reviewNotes: 'reviewNotes',
    reviewedBy: 'reviewedBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const DocumentReviewScalarFieldEnum = {
    id: 'id',
    driverId: 'driverId',
    documentKey: 'documentKey',
    decision: 'decision',
    reason: 'reason',
    decidedBy: 'decidedBy',
    decidedAt: 'decidedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const VerificationStatusChangeScalarFieldEnum = {
    id: 'id',
    driverId: 'driverId',
    fromStatus: 'fromStatus',
    toStatus: 'toStatus',
    reason: 'reason',
    markedFields: 'markedFields',
    changedBy: 'changedBy',
    createdAt: 'createdAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const NullableJsonNullValueInput = {
    DbNull: DbNull,
    JsonNull: JsonNull
};
export const JsonNullValueInput = {
    JsonNull: JsonNull
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const JsonNullValueFilter = {
    DbNull: DbNull,
    JsonNull: JsonNull,
    AnyNull: AnyNull
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
export const defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map