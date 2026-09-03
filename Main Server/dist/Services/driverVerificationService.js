"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canEdit = canEdit;
exports.guardSubmission = guardSubmission;
exports.computeStatus = computeStatus;
exports.getStatus = getStatus;
exports.getSubmission = getSubmission;
exports.submitOrResubmit = submitOrResubmit;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const constants_1 = require("../config/constants");
const verificationService_1 = require("./verificationService");
const auditService_1 = __importDefault(require("./auditService"));
const DRIVER_DOC_FIELDS = [
    'userIdentificationFront',
    'userIdentificationBack',
    'linceseFront',
    'linceseBack',
    'personalImageWithId',
];
const VEHICLE_DOC_FIELDS = [
    'registrationDocFront',
    'registrationDocBack',
    'vehiclePhotoFront',
    'vehiclePhotoBack',
];
function isUniqueViolation(err) {
    const code = err && err.parent && err.parent.code;
    return code === '23505';
}
function uniqueViolationMessage(err) {
    const constraint = err && err.parent && err.parent.constraint;
    if (constraint === 'vehicles_driver_id_key') {
        return 'You already have a registered vehicle. Update it instead.';
    }
    if (constraint && constraint.includes('plate_number')) {
        return 'This plate number is already registered to another vehicle.';
    }
    return 'The vehicle could not be saved because a unique field already exists.';
}
/**
 * State machine rules — exported as pure functions so the unit test can cover
 * transitions and can_edit rules without a database.
 */
function canEdit(status) {
    return status === constants_1.VERIFICATION_STATUS.UNVERIFIED || status === constants_1.VERIFICATION_STATUS.REJECTED;
}
function guardSubmission(status) {
    if (status === constants_1.VERIFICATION_STATUS.PENDING) {
        throw ApiError_1.ApiErrors.conflict('YOUR_VERIFICATION_APPLICATION_IS_ALREADY_UNDER_REVIEW');
    }
    if (status === constants_1.VERIFICATION_STATUS.APPROVED) {
        throw ApiError_1.ApiErrors.forbidden('YOUR_VERIFICATION_IS_APPROVED_AND_LOCKED_CONTACT_SUPPORT_IF_YOU');
    }
}
function computeStatus(user, profile, vehicle) {
    if (user.verificationRejectedAt || (vehicle && vehicle.verificationRejectedAt)) {
        return constants_1.VERIFICATION_STATUS.REJECTED;
    }
    const profileVerified = Boolean(profile && profile.idVerified);
    const vehicleVerified = Boolean(vehicle && vehicle.isVerified);
    if (profileVerified && vehicleVerified) {
        return constants_1.VERIFICATION_STATUS.APPROVED;
    }
    if (user.verificationStatus === constants_1.VERIFICATION_STATUS.PENDING) {
        return constants_1.VERIFICATION_STATUS.PENDING;
    }
    if (user.verificationStatus === constants_1.VERIFICATION_STATUS.APPROVED) {
        return constants_1.VERIFICATION_STATUS.APPROVED;
    }
    if (profile || vehicle) {
        return constants_1.VERIFICATION_STATUS.PENDING;
    }
    return constants_1.VERIFICATION_STATUS.UNVERIFIED;
}
function buildDriverPayload(user, profile) {
    return {
        full_name: user.fullName || null,
        national_id: profile ? profile.nationalID : null,
        license_number: profile ? profile.licenseNumber : null,
        license_expiry: profile ? profile.licenseExpiry : null,
        user_identification_front: profile ? profile.userIdentificationFront : null,
        user_identification_back: profile ? profile.userIdentificationBack : null,
        lincese_front: profile ? profile.linceseFront : null,
        lincese_back: profile ? profile.linceseBack : null,
        personal_image_with_id: profile ? profile.personalImageWithId : null,
    };
}
function buildVehiclePayload(vehicle) {
    if (!vehicle) {
        return {
            id: null,
            manufacturer: null,
            model: null,
            vehicle_type: null,
            model_year: null,
            plate_number: null,
            code_number: null,
            color: null,
            seats: null,
            registration_doc_front: null,
            registration_doc_back: null,
            vehicle_photo_front: null,
            vehicle_photo_back: null,
        };
    }
    return {
        id: vehicle.id,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        vehicle_type: vehicle.vehicleType,
        model_year: vehicle.modelYear,
        plate_number: vehicle.plateNumber,
        code_number: vehicle.codeNumber,
        color: vehicle.color,
        seats: vehicle.seats,
        registration_doc_front: vehicle.registrationDocFront,
        registration_doc_back: vehicle.registrationDocBack,
        vehicle_photo_front: vehicle.vehiclePhotoFront,
        vehicle_photo_back: vehicle.vehiclePhotoBack,
    };
}
async function loadDriverData(driverId) {
    const user = await Models_1.User.findByPk(driverId);
    if (!user)
        throw ApiError_1.ApiErrors.notFound('DRIVER_NOT_FOUND');
    const profile = await Models_1.DriverProfile.findOne({ where: { driverId } });
    const vehicle = await Models_1.Vehicle.findOne({ where: { driverId } });
    return { user, profile, vehicle };
}
async function getStatus(driverId) {
    const { user, profile, vehicle } = await loadDriverData(driverId);
    const status = computeStatus(user, profile, vehicle);
    return {
        status: {
            value: status,
            can_edit: canEdit(status),
            submitted_at: user.verificationSubmittedAt ||
                (profile && (profile.createdat || profile.createdAt)) ||
                (vehicle && (vehicle.createdat || vehicle.createdAt)) ||
                null,
            rejected_at: user.verificationRejectedAt || (vehicle && vehicle.verificationRejectedAt) || null,
            rejection_reason: user.verificationRejectionReason || (vehicle && vehicle.verificationRejectionReason) || null,
            fields_to_fix: user.verificationRejectionFields || [],
        },
        driver: buildDriverPayload(user, profile),
        vehicle: buildVehiclePayload(vehicle),
    };
}
async function getSubmission(driverId) {
    const { user, profile, vehicle } = await loadDriverData(driverId);
    return {
        driver: buildDriverPayload(user, profile),
        vehicle: buildVehiclePayload(vehicle),
    };
}
async function verifyDocumentIds(body) {
    const docIds = [
        ...DRIVER_DOC_FIELDS.map((f) => body[f]),
        ...VEHICLE_DOC_FIELDS.map((f) => body.vehicle && body.vehicle[f]),
    ].filter((id) => id !== undefined && id !== null);
    if (docIds.length === 0)
        return;
    const uniqueIds = [...new Set(docIds)];
    const found = await Models_1.UploadedImage.findAll({ where: { id: { [sequelize_1.Op.in]: uniqueIds } } });
    if (found.length !== uniqueIds.length) {
        throw ApiError_1.ApiErrors.validation('ONE_OR_MORE_UPLOADED_DOCUMENT_IDS_DO_NOT_EXIST');
    }
}
async function submitOrResubmit(driverId, body) {
    const { user, profile, vehicle } = await loadDriverData(driverId);
    const currentStatus = computeStatus(user, profile, vehicle);
    guardSubmission(currentStatus);
    await verifyDocumentIds(body);
    const submittedAt = new Date();
    const transaction = await database_1.default.transaction();
    try {
        const profileData = {
            driverId,
            nationalID: body.national_id !== undefined ? body.national_id : (profile ? profile.nationalID : null),
            licenseNumber: body.license_number !== undefined ? body.license_number : (profile ? profile.licenseNumber : null),
            licenseExpiry: body.license_expiry !== undefined ? body.license_expiry : (profile ? profile.licenseExpiry : null),
            userIdentificationFront: body.user_identification_front !== undefined ? body.user_identification_front : (profile ? profile.userIdentificationFront : null),
            userIdentificationBack: body.user_identification_back !== undefined ? body.user_identification_back : (profile ? profile.userIdentificationBack : null),
            linceseFront: body.lincese_front !== undefined ? body.lincese_front : (profile ? profile.linceseFront : null),
            linceseBack: body.lincese_back !== undefined ? body.lincese_back : (profile ? profile.linceseBack : null),
            personalImageWithId: body.personal_image_with_id !== undefined ? body.personal_image_with_id : (profile ? profile.personalImageWithId : null),
        };
        if (profile) {
            await profile.update(profileData, { transaction });
        }
        else {
            await Models_1.DriverProfile.create(profileData, { transaction });
        }
        const v = body.vehicle || {};
        const vehicleData = {
            driverId,
            manufacturer: v.manufacturer,
            model: v.model,
            vehicleType: v.vehicle_type,
            modelYear: v.model_year !== undefined ? v.model_year : (vehicle ? vehicle.modelYear : null),
            plateNumber: v.plate_number,
            codeNumber: v.code_number !== undefined ? v.code_number : (vehicle ? vehicle.codeNumber : null),
            color: v.color !== undefined ? v.color : (vehicle ? vehicle.color : null),
            seats: v.seats,
            registrationDocFront: v.registration_doc_front !== undefined ? v.registration_doc_front : (vehicle ? vehicle.registrationDocFront : null),
            registrationDocBack: v.registration_doc_back !== undefined ? v.registration_doc_back : (vehicle ? vehicle.registrationDocBack : null),
            vehiclePhotoFront: v.vehicle_photo_front !== undefined ? v.vehicle_photo_front : (vehicle ? vehicle.vehiclePhotoFront : null),
            vehiclePhotoBack: v.vehicle_photo_back !== undefined ? v.vehicle_photo_back : (vehicle ? vehicle.vehiclePhotoBack : null),
            isVerified: false,
            verificationNotes: null,
            verificationRejectionReason: null,
            verificationRejectedAt: null,
            verifiedBy: null,
            verifiedAt: null,
        };
        if (vehicle) {
            await vehicle.update(vehicleData, { transaction });
        }
        else {
            await Models_1.Vehicle.create(vehicleData, { transaction });
        }
        if (body.full_name !== undefined) {
            await user.update({ fullName: body.full_name }, { transaction });
        }
        await user.update({
            verificationStatus: constants_1.VERIFICATION_STATUS.PENDING,
            verificationSubmittedAt: submittedAt,
            isVerified: false,
            verificationRejectedAt: null,
            verificationRejectionReason: null,
            verificationRejectionFields: [],
        }, { transaction });
        await (0, verificationService_1.recordStatusChange)(driverId, currentStatus, constants_1.VERIFICATION_STATUS.PENDING, { transaction });
        await transaction.commit();
    }
    catch (err) {
        await transaction.rollback();
        if (isUniqueViolation(err)) {
            throw ApiError_1.ApiErrors.validation(uniqueViolationMessage(err));
        }
        throw err;
    }
    await (0, verificationService_1.alertAdminsOfNewSubmission)({ driverId, fullName: user.fullName });
    auditService_1.default.track({
        action: 'verification.submitted',
        resourceType: 'user',
        resourceId: driverId,
        resourceLabel: user.fullName,
        actorId: driverId,
        actorType: 'driver',
        payload: { from_status: currentStatus, to_status: constants_1.VERIFICATION_STATUS.PENDING },
    });
    return { status: constants_1.VERIFICATION_STATUS.PENDING, submitted_at: submittedAt };
}
module.exports = {
    canEdit,
    guardSubmission,
    computeStatus,
    getStatus,
    getSubmission,
    submitOrResubmit,
};
exports.default = module.exports;
//# sourceMappingURL=driverVerificationService.js.map