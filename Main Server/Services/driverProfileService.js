const { Op } = require('sequelize');
const { User, DriverProfile, Vehicle, Rating, Penalty, DriverSubscription } = require('../Models');
const statsService = require('./statsService');
const balanceService = require('./balanceService');
const { USER_STATUS, PENALTY_TYPES, SUBSCRIPTION_STATUS } = require('../config/constants');
const { loadDriverUser, ensureReadable } = require('../utils/userAccess');

// Arabic month names for the member_since label (spec 010)
const AR_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// Static ordered navigation menu for the main profile screen (source doc §3.1)
const MENU_ITEMS = [
    { key: 'personal_data', label: 'البيانات الشخصية', icon: 'user' },
    { key: 'subscriptions', label: 'الباقات', icon: 'crown' },
    { key: 'ratings', label: 'التقييمات والشارات', icon: 'star' },
    { key: 'settings', label: 'الإعدادات والأمان', icon: 'settings' },
    { key: 'support', label: 'الدعم الفني', icon: 'headset' },
    { key: 'account_status', label: 'حالة الحساب', icon: 'shield' },
    { key: 'terms', label: 'الشروط وسياسة الخصوصية', icon: 'file-text' },
    { key: 'about', label: 'عن تطبيق مسار', icon: 'info' },
    { key: 'delete_account', label: 'حذف الحساب', icon: 'trash' },
];

function formatMemberSince(date) {
    if (!date) return null;
    const d = new Date(date);
    return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Percentage of visible ratings where the driver was NOT late (research D4).
 * Returns 0 when there are no ratings.
 */
async function computePunctualityRate(rateeId) {
    const total = await Rating.count({ where: { rateeId, isVisible: { [Op.ne]: false } } });
    if (!total) return 0;
    const onTime = await Rating.count({
        where: { rateeId, isVisible: { [Op.ne]: false }, wasLate: false },
    });
    return Math.round((onTime / total) * 100);
}

/** Deterministic badge derivation rules (research D5). */
function deriveBadges({ stats, punctualityRate, totalRatings, vehicle }) {
    const badges = [];
    const avg = Number(stats.avg_rating || 0);
    if (avg >= 4.5 && (stats.completed_trips || 0) >= 10) badges.push('سائق محترف');
    if (punctualityRate >= 90 && totalRatings >= 5) badges.push('ملتزم بالمواعيد');
    if ((stats.no_show_rate || 0) < 5) badges.push('قيادة آمنة');
    if (avg >= 4.8) badges.push('تعامل ممتاز');
    if (vehicle && vehicle.isVerified === true) badges.push('مركبة نظيفة');
    return badges;
}

function serializeVehicle(vehicle) {
    if (!vehicle) return null;
    return {
        vehicle_id: vehicle.id,
        make: vehicle.manufacturer,
        model: vehicle.model,
        year: vehicle.modelYear ?? null,
        color: vehicle.color ?? null,
        plate_number: vehicle.plateNumber,
        total_seats: vehicle.seats,
        verified: vehicle.isVerified === true,
        vehicle_type: vehicle.vehicleType ?? null,
    };
}

/** Subscription card for GET /api/driver/profile/full (contracts §1). */
function buildSubscriptionCard(subscription) {
    if (!subscription) return null;
    const plain = subscription instanceof DriverSubscription
        ? subscription.get({ plain: true })
        : subscription;

    // findCurrentSubscription already filters to status=active & not expired.
    const isActive = plain.status === SUBSCRIPTION_STATUS.ACTIVE
        && (!plain.expiresAt || new Date(plain.expiresAt) > new Date());
    if (!isActive) return null;

    const expiresAt = plain.expiresAt ? new Date(plain.expiresAt) : null;
    const planName = plain.planName ?? null;
    return {
        tier: planName && String(planName).toLowerCase().includes('pro') ? 'pro' : 'free',
        price: Number(plain.planCost || 0),
        currency: 'JOD',
        plan_name: planName,
        expires_at: plain.expiresAt || null,
        days_remaining: expiresAt
            ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))
            : null,
        is_active: true,
    };
}

/** Aggregated payload powering GET /api/driver/profile/full (contracts §1). */
async function getFullProfile(driverId) {
    const user = await loadDriverUser(driverId);
    ensureReadable(user);

    const [driverProfile, vehicle, lifetime] = await Promise.all([
        DriverProfile.findOne({ where: { driverId } }),
        Vehicle.findOne({ where: { driverId } }),
        statsService.lifetime(driverId),
    ]);

    let subscription = null;
    try {
        subscription = await balanceService.findCurrentSubscription(driverId);
    } catch (err) {
        subscription = null;
    }

    const punctualityRate = await computePunctualityRate(driverId);
    const totalRatings = await Rating.count({ where: { rateeId: driverId, isVisible: { [Op.ne]: false } } });

    return {
        driver: {
            id: user.id,
            full_name: user.fullName ?? null,
            display_name: user.displayName ?? null,
            phone: user.phone,
            email: user.email ?? null,
            profile_picture_url: user.avatarUrl ?? null,
            national_id: driverProfile?.nationalID ?? null,
            age: user.age != null ? Number(user.age) : null,
            gender: user.gender ?? null,
            joined_at: user.createdat || user.createdAt || null,
            member_since: formatMemberSince(user.createdat || user.createdAt),
            is_verified: user.isVerified === true,
            verification_status: user.verificationStatus,
        },
        vehicle: serializeVehicle(vehicle),
        subscription: buildSubscriptionCard(
            subscription instanceof DriverSubscription
                ? subscription.get({ plain: true })
                : subscription
        ),
        stats: (() => {
            const s = lifetime.stats || {};
            return {
                total_trips_completed: s.completed_trips ?? 0,
                average_rating: Number(s.avg_rating ?? user.avgRating ?? 0),
                total_ratings: totalRatings,
                punctuality_rate: punctualityRate,
                no_show_rate: s.no_show_rate ?? 0,
                response_rate: s.response_rate ?? null,
                badges: deriveBadges({
                    stats: s,
                    punctualityRate,
                    totalRatings,
                    vehicle,
                }),
            };
        })(),
        menu_items: MENU_ITEMS,
    };
}

/** Account standing overview powering GET /api/driver/account-status. */
async function getAccountStatus(driverId) {
    const user = await loadDriverUser(driverId);
    ensureReadable(user);

    const now = new Date();
    const activePenalties = await Penalty.findAll({
        where: {
            userId: driverId,
            startsAt: { [Op.lte]: now },
            [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }],
        },
        order: [['createdat', 'DESC']],
    });

    const deletionRequestService = require('./deletionRequestService');
    const hasDeletionRequest = await deletionRequestService.hasPendingRequest(driverId);
    const suspension = activePenalties.find((p) => p.type === PENALTY_TYPES.SUSPENSION);

    return {
        status: user.status,
        verification_status: user.verificationStatus,
        is_verified: user.isVerified === true,
        is_suspended: user.status === USER_STATUS.SUSPENDED,
        is_banned: user.status === USER_STATUS.BANNED,
        suspension_details: suspension
            ? {
                  reason: suspension.reason,
                  starts_at: suspension.startsAt,
                  ends_at: suspension.endsAt,
              }
            : null,
        active_penalties: activePenalties.map((p) => ({
            id: p.id,
            type: p.type,
            reason: p.reason,
            created_at: p.createdat || p.createdAt || null,
            expires_at: p.endsAt || null,
        })),
        is_deletion_requested: hasDeletionRequest,
        can_delete: user.status !== USER_STATUS.BANNED && !hasDeletionRequest,
        can_logout: true,
    };
}

module.exports = {
    MENU_ITEMS,
    formatMemberSince,
    computePunctualityRate,
    deriveBadges,
    serializeVehicle,
    buildSubscriptionCard,
    getFullProfile,
    getAccountStatus,
};
