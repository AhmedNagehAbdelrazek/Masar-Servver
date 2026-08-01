const { Op } = require('sequelize');
const { DriverProfile, Vehicle, User, UploadedImage } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { maskPhone } = require('../utils/masking');
const { parsePagination, buildPagination } = require('../utils/pagination');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

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
 * Admin verification queue (contract A1). Returns pending drivers and
 * vehicles with their document image URLs resolved from `uploaded_images`.
 */
async function getQueue(filters = {}) {
  const { type } = filters;
  const { page, limit } = parsePagination(filters);

  const items = [];

  if (!type || type === 'driver') {
    const profiles = await DriverProfile.findAll({
      where: { idVerified: false },
      include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'createdat'] }],
    });
    const urls = await resolveImageUrls(
      profiles.flatMap((p) => DRIVER_DOC_LABELS.map(([f]) => p[f]))
    );
    for (const p of profiles) {
      items.push({
        type: 'driver',
        driver_id: p.driverId,
        full_name: p.driver ? p.driver.fullName : null,
        phone: maskPhone(p.driver ? p.driver.phone : null),
        submitted_at: p.createdat || p.createdAt,
        documents: buildDocuments(p, DRIVER_DOC_LABELS, urls),
        id_verified: false,
      });
    }
  }

  if (!type || type === 'vehicle') {
    const vehicles = await Vehicle.findAll({
      where: { isVerified: false },
      include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone'] }],
    });
    const urls = await resolveImageUrls(
      vehicles.flatMap((v) => VEHICLE_DOC_LABELS.map(([f]) => v[f]))
    );
    for (const v of vehicles) {
      items.push({
        type: 'vehicle',
        vehicle_id: v.id,
        manufacturer: v.manufacturer,
        model: v.model,
        plate_number: v.plateNumber,
        full_name: v.driver ? v.driver.fullName : null,
        documents: buildDocuments(v, VEHICLE_DOC_LABELS, urls),
        is_verified: false,
      });
    }
  }

  items.sort((a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0));

  const total = items.length;
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    pagination: buildPagination(total, page, limit),
  };
}

async function approveDriver(adminId, driverId) {
  const profile = await DriverProfile.findOne({ where: { driverId } });
  if (!profile) throw ApiErrors.notFound('Driver profile not found');

  await profile.update({
    idVerified: true,
  });

  const driver = await User.findByPk(driverId);
  if (driver) {
    await notificationService.sendToUser(driver, 'VERIFICATION_APPROVED', {
      channels: ['in_app', 'push'],
      vars: { subject: 'identity documents' },
      data: { driver_id: driverId },
    });
  }

  auditService.track({
    action: 'verification.driver.approve',
    resourceType: 'driver_profile',
    resourceId: driverId,
    resourceLabel: driver && driver.fullName,
    actorId: adminId,
    payload: { driver_id: driverId },
  });

  return { driver_id: driverId, id_verified: true, notified: true };
}

async function rejectDriver(adminId, driverId, reason) {
  const profile = await DriverProfile.findOne({ where: { driverId } });
  if (!profile) throw ApiErrors.notFound('Driver profile not found');

  await profile.update({ idVerified: false });

  const driver = await User.findByPk(driverId);
  if (driver) {
    await notificationService.sendToUser(driver, 'VERIFICATION_REJECTED', {
      channels: ['in_app', 'push'],
      vars: { subject: 'identity documents', reason },
      data: { driver_id: driverId, reason },
    });
  }

  auditService.track({
    action: 'verification.driver.reject',
    resourceType: 'driver_profile',
    resourceId: driverId,
    resourceLabel: driver && driver.fullName,
    actorId: adminId,
    payload: { driver_id: driverId, reason },
  });

  return { driver_id: driverId, id_verified: false, reason, notified: true };
}

async function approveVehicle(adminId, vehicleId) {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) throw ApiErrors.notFound('Vehicle not found');

  await vehicle.update({
    isVerified: true,
    verifiedBy: adminId,
    verifiedAt: new Date(),
  });

  const owner = await User.findByPk(vehicle.driverId);
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

async function rejectVehicle(adminId, vehicleId, reason) {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) throw ApiErrors.notFound('Vehicle not found');

  await vehicle.update({
    isVerified: false,
    verificationNotes: reason,
  });

  const owner = await User.findByPk(vehicle.driverId);
  if (owner) {
    await notificationService.sendToUser(owner, 'VERIFICATION_REJECTED', {
      channels: ['in_app', 'push'],
      vars: { subject: 'vehicle', reason },
      data: { vehicle_id: vehicleId, reason },
    });
  }

  auditService.track({
    action: 'verification.vehicle.reject',
    resourceType: 'vehicle',
    resourceId: vehicleId,
    resourceLabel: `${vehicle.manufacturer} ${vehicle.model}`,
    actorId: adminId,
    payload: { vehicle_id: vehicleId, reason },
  });

  return { vehicle_id: vehicleId, is_verified: false, reason, notified: true };
}

module.exports = {
  getQueue,
  approveDriver,
  rejectDriver,
  approveVehicle,
  rejectVehicle,
};
