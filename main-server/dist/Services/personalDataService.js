"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCKED_WHEN_VERIFIED = exports.EDITABLE_ANYTIME = void 0;
exports.buildPersonalDataView = buildPersonalDataView;
exports.updatePersonalData = updatePersonalData;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const constants_1 = require("../config/constants");
const userAccess_1 = require("../utils/userAccess");
const driverVerificationService_1 = require("./driverVerificationService");
const auditService_1 = __importDefault(require("./auditService"));
const { ApiErrors } = ApiError_1.default;
// Fields editable regardless of verification state (research D7)
const EDITABLE_ANYTIME = ['display_name', 'phone', 'age', 'avatar_url'];
exports.EDITABLE_ANYTIME = EDITABLE_ANYTIME;
// Identity + vehicle fields that freeze once verification is in review/approved
const LOCKED_WHEN_VERIFIED = [
    'full_name',
    'email',
    'national_id',
    'vehicle.manufacturer',
    'vehicle.model',
    'vehicle.model_year',
    'vehicle.color',
    'vehicle.plate_number',
    'vehicle.total_seats',
];
exports.LOCKED_WHEN_VERIFIED = LOCKED_WHEN_VERIFIED;
function genderLabel(gender) {
    if (gender === 'male')
        return 'ذكر';
    if (gender === 'female')
        return 'أنثى';
    return null;
}
function serializePersonalData(user) {
    return {
        full_name: user.fullName ?? null,
        display_name: user.displayName ?? null,
        country_code: user.countryCode ?? '+962',
        phone: user.phone ?? null,
        email: user.email ?? null,
        email_verified: false,
        age: user.age != null ? Number(user.age) : null,
        gender: user.gender ?? null,
        gender_label: genderLabel(user.gender),
        avatar_url: user.avatarUrl ?? null,
        national_id: user.driverProfile?.nationalID ?? null,
    };
}
function serializeVehicle(vehicle) {
    if (!vehicle)
        return null;
    return {
        id: vehicle.id,
        manufacturer: vehicle.manufacturer ?? null,
        model: vehicle.model ?? null,
        model_year: vehicle.modelYear ?? null,
        color: vehicle.color ?? null,
        plate_number: vehicle.plateNumber ?? null,
        total_seats: vehicle.seats ?? null,
    };
}
async function buildPersonalDataView(userId) {
    const user = await (0, userAccess_1.loadDriverUser)(userId);
    (0, userAccess_1.ensureReadable)(user);
    const [driverProfile, vehicle] = await Promise.all([
        Models_1.DriverProfile.findOne({ where: { driverId: userId } }),
        Models_1.Vehicle.findOne({ where: { driverId: userId } }),
    ]);
    user.driverProfile = driverProfile;
    let lockedFields = [];
    let rejectedFields = [];
    if (user.verificationStatus === constants_1.VERIFICATION_STATUS.PENDING
        || user.verificationStatus === constants_1.VERIFICATION_STATUS.APPROVED) {
        lockedFields = LOCKED_WHEN_VERIFIED;
    }
    else if (user.verificationStatus === constants_1.VERIFICATION_STATUS.REJECTED) {
        rejectedFields = Array.isArray(user.verificationRejectionFields)
            ? user.verificationRejectionFields
            : [];
    }
    return {
        personal_data: serializePersonalData(user),
        vehicle: serializeVehicle(vehicle),
        editable_now: EDITABLE_ANYTIME,
        locked_fields: lockedFields,
        rejected_fields: rejectedFields,
    };
}
function extractLockedAttempts(payload) {
    const attempts = [];
    if (payload.full_name !== undefined)
        attempts.push('full_name');
    if (payload.email !== undefined)
        attempts.push('email');
    if (payload.national_id !== undefined)
        attempts.push('national_id');
    if (payload.vehicle && typeof payload.vehicle === 'object') {
        Object.keys(payload.vehicle).forEach((key) => {
            if (payload.vehicle[key] !== undefined) {
                attempts.push(`vehicle.${key === 'model_year' ? 'model_year' : key}`);
            }
        });
    }
    return attempts;
}
async function assertUniqueness(userId, payload) {
    if (payload.email) {
        const clash = await Models_1.User.findOne({
            where: { email: payload.email, id: { [sequelize_1.Op.ne]: userId } },
        });
        if (clash) {
            throw ApiErrors.custom('EMAIL_ALREADY_IN_USE', 409, 'EMAIL_ALREADY_IN_USE');
        }
    }
    if (payload.phone) {
        const clash = await Models_1.User.findOne({
            where: { phone: payload.phone, id: { [sequelize_1.Op.ne]: userId } },
        });
        if (clash) {
            throw ApiErrors.custom('PHONE_ALREADY_IN_USE', 409, 'PHONE_ALREADY_IN_USE');
        }
    }
    if (payload.vehicle && payload.vehicle.plate_number) {
        const clash = await Models_1.Vehicle.findOne({
            where: { plateNumber: payload.vehicle.plate_number, driverId: { [sequelize_1.Op.ne]: userId } },
        });
        if (clash) {
            throw ApiErrors.custom('PLATE_NUMBER_ALREADY_IN_USE', 409, 'PLATE_ALREADY_IN_USE');
        }
    }
}
/**
 * Apply an edit from the personal-data screen. Identity/vehicle edits are
 * allowed only while unverified/rejected and push the account back into
 * `pending` review (research D7).
 */
async function updatePersonalData(userId, payload) {
    await assertUniqueness(userId, payload);
    const user = await (0, userAccess_1.loadDriverUser)(userId);
    (0, userAccess_1.ensureOperational)(user);
    const canEditIdentity = (0, driverVerificationService_1.canEdit)(user.verificationStatus);
    if (!canEditIdentity) {
        const attempts = extractLockedAttempts(payload);
        if (attempts.length > 0) {
            throw ApiErrors.custom('LOCKED_FIELDS_CANNOT_BE_MODIFIED', 403, 'FIELD_LOCKED', null, { fields: attempts.join(', ') });
        }
    }
    const userAttrs = {};
    if (payload.full_name !== undefined)
        userAttrs.fullName = payload.full_name;
    if (payload.display_name !== undefined)
        userAttrs.displayName = payload.display_name;
    if (payload.email !== undefined)
        userAttrs.email = payload.email || null;
    if (payload.phone !== undefined)
        userAttrs.phone = payload.phone;
    if (payload.age !== undefined)
        userAttrs.age = payload.age;
    if (payload.avatar_url !== undefined)
        userAttrs.avatarUrl = payload.avatar_url;
    const identityChanged = Boolean(payload.full_name !== undefined
        || payload.national_id !== undefined
        || (payload.vehicle && Object.keys(payload.vehicle).length > 0));
    if (Object.keys(userAttrs).length > 0) {
        await user.update(userAttrs);
    }
    if (payload.national_id !== undefined) {
        const profile = await Models_1.DriverProfile.findOne({ where: { driverId: userId } });
        if (profile) {
            await profile.update({ nationalID: payload.national_id });
        }
        else {
            await Models_1.DriverProfile.create({ driverId: userId, nationalID: payload.national_id });
        }
    }
    if (payload.vehicle && typeof payload.vehicle === 'object') {
        const v = payload.vehicle;
        const vehicleAttrs = {};
        if (v.manufacturer !== undefined)
            vehicleAttrs.manufacturer = v.manufacturer;
        if (v.model !== undefined)
            vehicleAttrs.model = v.model;
        if (v.model_year !== undefined)
            vehicleAttrs.modelYear = v.model_year;
        if (v.color !== undefined)
            vehicleAttrs.color = v.color;
        if (v.plate_number !== undefined)
            vehicleAttrs.plateNumber = v.plate_number;
        if (v.total_seats !== undefined)
            vehicleAttrs.seats = v.total_seats;
        if (Object.keys(vehicleAttrs).length > 0) {
            const vehicle = await Models_1.Vehicle.findOne({ where: { driverId: userId } });
            if (vehicle) {
                await vehicle.update(vehicleAttrs);
            }
            else {
                await Models_1.Vehicle.create({ ...vehicleAttrs, driverId: userId });
            }
        }
    }
    // Identity edits from an unverified/rejected driver restart the review.
    let requiresVerification = false;
    if (identityChanged && canEditIdentity) {
        await user.update({
            verificationStatus: constants_1.VERIFICATION_STATUS.PENDING,
            verificationSubmittedAt: new Date(),
        });
        requiresVerification = true;
    }
    auditService_1.default.track({
        eventType: 'domain.event',
        action: 'account.personal_data_updated',
        resourceType: 'user',
        resourceId: user.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
        payload: {
            fields: Object.keys(payload),
            requires_verification: requiresVerification,
        },
    });
    const view = await buildPersonalDataView(userId);
    return {
        ...view,
        verification_status: user.verificationStatus,
        requires_verification: requiresVerification,
        message: requiresVerification
            ? 'تم تحديث بياناتك وإرسالها للمراجعة'
            : 'تم تحديث البيانات بنجاح',
    };
}
module.exports = {
    EDITABLE_ANYTIME,
    LOCKED_WHEN_VERIFIED,
    buildPersonalDataView,
    updatePersonalData,
};
exports.default = module.exports;
//# sourceMappingURL=personalDataService.js.map