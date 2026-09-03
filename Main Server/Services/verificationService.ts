// @ts-nocheck
import { Op } from 'sequelize';
import { DriverProfile, Vehicle, User, UploadedImage, VerificationStatusChange } from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';
import { parsePagination, buildPagination } from '../utils/pagination';
import { VERIFICATION_STATUS } from '../config/constants';
import notificationService from './notificationService';
import auditService from './auditService';

async function syncUserVerification(driverId) {
  const profile = await DriverProfile.findOne({ where: { driverId } });
  const vehicle = await Vehicle.findOne({ where: { driverId } });
  const profileVerified = Boolean(profile && profile.idVerified);
  const vehicleVerified = Boolean(vehicle && vehicle.isVerified);
  const fullyVerified = profileVerified && vehicleVerified;

  await User.update({ isVerified: fullyVerified }, { where: { id: driverId } });

  return { profileVerified, vehicleVerified, fullyVerified };
}

const DRIVER_DOC_LABELS = [
  ['userIdentificationFront', 'national_id_front'],
  ['userIdentificationBack', 'national_id_back'],
  ['linceseFront', 'license_front'],
  ['linceseBack', 'license_back'],
  ['personalImageWithId', 'personal_with_id'],
];

const VEHICLE_DOC_LABELS = [
  ['registrationDocFront', 'registration_doc_front'],
  ['registrationDocBack', 'registration_doc_back'],
  ['vehiclePhotoFront', 'vehicle_photo_front'],
  ['vehiclePhotoBack', 'vehicle_photo_back'],
];

async function resolveImageUrls(imageIds) {
  const ids = [...new Set(imageIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const images = await UploadedImage.findAll({ where: { id: { [Op.in]: ids } } });
  return new Map(images.map((img) => [img.id, img.url]));
}

function buildDocuments(record, labels, urls) {
  const documents = [];
  for (const [field, label] of labels) {
    const imageId = record[field];
    if (imageId && urls.has(imageId)) {
      documents.push({ label, url: urls.get(imageId) });
    }
  }
  return documents;
}

/**
 * Append a driver-visible verification status transition to the audit table.
 * Called from both the driver (submit/resubmit) and admin (approve/reject) paths.
 */
async function recordStatusChange(
  driverId,
  fromStatus,
  toStatus,
  { reason = null, markedFields = null, changedBy = null, transaction = null } = {}
) {
  const options = transaction ? { transaction } : {};
  return VerificationStatusChange.create(
    {
      driverId,
      fromStatus,
      toStatus,
      reason,
      markedFields: markedFields || null,
      changedBy,
    },
    options
  );
}

/**
 * Ordered history of a driver's verification status transitions (audit).
 */
async function getVerificationHistory(driverId, { limit = 50 } = {}) {
  return VerificationStatusChange.findAll({
    where: { driverId },
    order: [['createdat', 'DESC']],
    limit,
  });
}

/**
 * Notify all admins that a new/re-submitted verification package arrived.
 * Best-effort: failures are logged, never thrown to the driver request.
 */
async function alertAdminsOfNewSubmission({ driverId, fullName }) {
  try {
    const admins = await User.findAll({ where: { role: 'admin', status: 'active' } });
    for (const admin of admins) {
      await notificationService.sendToUser(admin, 'ADMIN_VERIFICATION_NEW', {
        channels: ['in_app', 'push'],
        vars: { driver_name: fullName || 'A driver' },
        data: { driver_id: driverId },
      });
    }
    return admins.length;
  } catch (err) {
    console.warn('[verification] admin alert failed:', err.message);
    return 0;
  }
}

const QUEUE_STATUS_KEYS = {
  pending: VERIFICATION_STATUS.PENDING,
  approved: VERIFICATION_STATUS.APPROVED,
  rejected: VERIFICATION_STATUS.REJECTED,
  unverified: VERIFICATION_STATUS.UNVERIFIED,
};

function buildQueueDriverPayload(user, profile) {
  return {
    user_id: user.id,
    full_name: user.fullName,
    phone: maskPhone(user.phone),
    profile_id: profile ? profile.id : null,
    national_id: profile ? profile.nationalID : null,
    license_number: profile ? profile.licenseNumber : null,
    user_identification_front: profile ? profile.userIdentificationFront : null,
    user_identification_back: profile ? profile.userIdentificationBack : null,
    lincese_front: profile ? profile.linceseFront : null,
    lincese_back: profile ? profile.linceseBack : null,
    personal_image_with_id: profile ? profile.personalImageWithId : null,
  };
}

function buildQueueVehiclePayload(vehicle) {
  if (!vehicle) return null;
  return {
    vehicle_id: vehicle.id,
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

/**
 * Admin verification queue (contract A3). Returns the combined driver+vehicle
 * package per driver, filtered by `users.verification_status` (default pending).
 */
async function getQueue(filters = {}) {
  const { status , search } = filters;
  const { page, limit } = parsePagination(filters);

  const where = {};
  if (Object.prototype.hasOwnProperty.call(QUEUE_STATUS_KEYS, status)) {
    where.verificationStatus = QUEUE_STATUS_KEYS[status];
  }
  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows: users, count } = await User.findAndCountAll({
    where,
    order: [
      ['verification_submitted_at', 'DESC'],
      ['createdat', 'DESC'],
    ],
    offset: (page - 1) * limit,
    limit,
    distinct: true,
  });

  const driverIds = users.map((u) => u.id);
  const profiles = driverIds.length
    ? await DriverProfile.findAll({ where: { driverId: { [Op.in]: driverIds } } })
    : [];
  const vehicles = driverIds.length
    ? await Vehicle.findAll({ where: { driverId: { [Op.in]: driverIds } } })
    : [];

  const profileMap = new Map(profiles.map((p) => [p.driverId, p]));
  const vehicleMap = new Map(vehicles.map((v) => [v.driverId, v]));

  const docIds = [
    ...profiles.flatMap((p) => DRIVER_DOC_LABELS.map(([f]) => p[f])),
    ...vehicles.flatMap((v) => VEHICLE_DOC_LABELS.map(([f]) => v[f])),
  ];
  const urls = await resolveImageUrls(docIds);

  const requests = users.map((u) => {
    const p = profileMap.get(u.id);
    const v = vehicleMap.get(u.id);
    return {
      id: u.id,
      status: {
        value: u.verificationStatus,
        submitted_at: u.verificationSubmittedAt,
      },
      driver: buildQueueDriverPayload(u, p),
      vehicle: buildQueueVehiclePayload(v),
      documents: [
        ...(p ? buildDocuments(p, DRIVER_DOC_LABELS, urls) : []),
        ...(v ? buildDocuments(v, VEHICLE_DOC_LABELS, urls) : []),
      ],
    };
  });

  return {
    requests,
    meta: buildPagination(count, page, limit),
  };
}

async function approveDriver(adminId, driverId) {
  const profile = await DriverProfile.findOne({ where: { driverId } });
  if (!profile) throw ApiErrors.notFound('DRIVER_PROFILE_NOT_FOUND');

  const user = await User.findByPk(driverId);
  if (!user) throw ApiErrors.notFound('DRIVER_NOT_FOUND');
  const fromStatus = user.verificationStatus;

  const vehicle = await Vehicle.findOne({ where: { driverId } });

  await profile.update({ idVerified: true });
  if (vehicle) {
    await vehicle.update({ isVerified: true, verifiedBy: adminId, verifiedAt: new Date() });
  }

  await user.update({
    isVerified: true,
    verificationStatus: VERIFICATION_STATUS.APPROVED,
  });

  await recordStatusChange(driverId, fromStatus, VERIFICATION_STATUS.APPROVED, { changedBy: adminId });

  await notificationService.sendToUser(user, 'VERIFICATION_APPROVED', {
    channels: ['in_app', 'push'],
    vars: { subject: 'identity documents' },
    data: { driver_id: driverId },
  });

  auditService.track({
    action: 'verification.driver.approve',
    resourceType: 'driver_profile',
    resourceId: driverId,
    resourceLabel: user.fullName,
    actorId: adminId,
    payload: { driver_id: driverId },
  });

  return { driver_id: driverId, id_verified: true, notified: true };
}

async function rejectDriver(adminId, driverId, reason, fieldsToFix) {
  const profile = await DriverProfile.findOne({ where: { driverId } });
  if (!profile) throw ApiErrors.notFound('DRIVER_PROFILE_NOT_FOUND');

  const user = await User.findByPk(driverId);
  if (!user) throw ApiErrors.notFound('DRIVER_NOT_FOUND');
  const fromStatus = user.verificationStatus;

  const vehicle = await Vehicle.findOne({ where: { driverId } });

  await profile.update({ idVerified: false });
  if (vehicle) {
    await vehicle.update({
      isVerified: false,
      verificationNotes: reason,
      verificationRejectionReason: reason,
      verificationRejectedAt: new Date(),
    });
  }

  const rejectedAt = new Date();
  await user.update({
    isVerified: false,
    verificationStatus: VERIFICATION_STATUS.REJECTED,
    verificationRejectedAt: rejectedAt,
    verificationRejectionReason: reason,
    verificationRejectionFields: fieldsToFix || [],
  });

  await recordStatusChange(driverId, fromStatus, VERIFICATION_STATUS.REJECTED, {
    reason,
    markedFields: fieldsToFix || [],
    changedBy: adminId,
  });

  await notificationService.sendToUser(user, 'VERIFICATION_REJECTED', {
    channels: ['in_app', 'push'],
    vars: { subject: 'identity documents', reason },
    data: { driver_id: driverId, reason, fields_to_fix: fieldsToFix || [] },
  });

  auditService.track({
    action: 'verification.driver.reject',
    resourceType: 'driver_profile',
    resourceId: driverId,
    resourceLabel: user.fullName,
    actorId: adminId,
    payload: { driver_id: driverId, reason, fields_to_fix: fieldsToFix || [] },
  });

  return { driver_id: driverId, id_verified: false, reason, notified: true };
}

async function approveVehicle(adminId, vehicleId) {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) throw ApiErrors.notFound('VEHICLE_NOT_FOUND');

  await vehicle.update({
    isVerified: true,
    verifiedBy: adminId,
    verifiedAt: new Date(),
  });

  const { fullyVerified } = await syncUserVerification(vehicle.driverId);

  const owner = await User.findByPk(vehicle.driverId);
  if (owner && fullyVerified && owner.verificationStatus !== VERIFICATION_STATUS.REJECTED) {
    const fromStatus = owner.verificationStatus;
    await owner.update({ verificationStatus: VERIFICATION_STATUS.APPROVED });
    await recordStatusChange(owner.id, fromStatus, VERIFICATION_STATUS.APPROVED, { changedBy: adminId });
  }

  if (owner) {
    await notificationService.sendToUser(owner, 'VERIFICATION_APPROVED', {
      channels: ['in_app', 'push'],
      vars: { subject: 'vehicle' },
      data: { vehicle_id: vehicleId },
    });
  }

  auditService.track({
    action: 'verification.vehicle.approve',
    resourceType: 'vehicle',
    resourceId: vehicleId,
    resourceLabel: `${vehicle.manufacturer} ${vehicle.model}`,
    actorId: adminId,
    payload: { vehicle_id: vehicleId },
  });

  return { vehicle_id: vehicleId, is_verified: true, notified: true };
}

async function rejectVehicle(adminId, vehicleId, reason, fieldsToFix) {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) throw ApiErrors.notFound('VEHICLE_NOT_FOUND');

  await vehicle.update({
    isVerified: false,
    verificationNotes: reason,
    verificationRejectionReason: reason,
    verificationRejectedAt: new Date(),
  });

  await syncUserVerification(vehicle.driverId);

  const owner = await User.findByPk(vehicle.driverId);
  if (owner) {
    const fromStatus = owner.verificationStatus;
    await owner.update({
      isVerified: false,
      verificationStatus: VERIFICATION_STATUS.REJECTED,
      verificationRejectedAt: new Date(),
      verificationRejectionReason: reason,
      verificationRejectionFields: fieldsToFix || [],
    });
    await recordStatusChange(owner.id, fromStatus, VERIFICATION_STATUS.REJECTED, {
      reason,
      markedFields: fieldsToFix || [],
      changedBy: adminId,
    });
  }

  if (owner) {
    await notificationService.sendToUser(owner, 'VERIFICATION_REJECTED', {
      channels: ['in_app', 'push'],
      vars: { subject: 'vehicle', reason },
      data: { vehicle_id: vehicleId, reason, fields_to_fix: fieldsToFix || [] },
    });
  }

  auditService.track({
    action: 'verification.vehicle.reject',
    resourceType: 'vehicle',
    resourceId: vehicleId,
    resourceLabel: `${vehicle.manufacturer} ${vehicle.model}`,
    actorId: adminId,
    payload: { vehicle_id: vehicleId, reason, fields_to_fix: fieldsToFix || [] },
  });

  return { vehicle_id: vehicleId, is_verified: false, reason, notified: true };
}

module.exports = {
  syncUserVerification,
  recordStatusChange,
  getVerificationHistory,
  alertAdminsOfNewSubmission,
  getQueue,
  approveDriver,
  rejectDriver,
  approveVehicle,
  rejectVehicle,
};
export { syncUserVerification, recordStatusChange, getVerificationHistory, alertAdminsOfNewSubmission, getQueue, approveDriver, rejectDriver, approveVehicle, rejectVehicle };
export default module.exports;