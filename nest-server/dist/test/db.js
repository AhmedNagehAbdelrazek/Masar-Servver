const TABLES = [
    'verification_status_changes',
    'document_reviews',
    'deletion_requests',
    'uploaded_images',
    'payment_methods',
    'subscription_transactions',
    'driver_subscriptions',
    'subscription_plans',
    'audit_logs',
    'recent_search',
    'favorite_routes',
    'favorite_drivers',
    'notification_settings',
    'notifications',
    'sos_events',
    'messages',
    'support_ticket_messages',
    'support_tickets',
    'penalties',
    'complaints',
    'delay_events',
    'ratings',
    'request_offers',
    'ride_requests',
    'bookings',
    'trip_locations',
    'trip_seats',
    'trip_stops',
    'trip_attributes',
    'trips',
    'vehicles',
    'passenger_profiles',
    'driver_profiles',
    'users',
];
export async function truncateAll(prisma) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.join(', ')} CASCADE`);
}
export async function resetTestState(prisma, redis) {
    await truncateAll(prisma);
    await redis.flushall();
}
//# sourceMappingURL=db.js.map