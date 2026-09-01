const { Op } = require('sequelize');
const { User, PassengerProfile, Penalty, Complaint } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { PENALTY_TYPES } = require('../config/constants');
const auditService = require('./auditService');

function serializeProfile(profile) {
  return {
    id: profile.id,
    passenger_id: profile.passengerId,
    preferred_gender: profile.preferredGender,
    smoking_preference: profile.smokingPreference,
    saved_routes: profile.savedRoutes || [],
    national_id: profile.nationalID ?? null,
    home_address: profile.homeAddress ?? null,
    emergency_contacts: profile.emergencyContacts || [],
    created_at: profile.createdat || profile.createdAt,
    updated_at: profile.updatedat || profile.updatedAt,
  };
}

function serializePersonal(user) {
  return {
    full_name: user.fullName ?? null,
    age: user.age != null ? Number(user.age) : null,
    gender: user.gender ?? null,
    phone: user.phone ?? null,
  };
}

async function getMyProfile(passengerId) {
  const [user, profile] = await Promise.all([
    User.findByPk(passengerId),
    PassengerProfile.findOrCreate({
      where: { passengerId },
      defaults: { passengerId },
    }),
  ]);

  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');

  return {
    passenger_profile: {
      ...serializePersonal(user),
      national_id: profile[0].nationalID ?? null,
      home_address: profile[0].homeAddress ?? null,
    },
  };
}

async function updateMyProfile(passengerId, payload) {
  const [profile, created] = await PassengerProfile.findOrCreate({
    where: { passengerId },
    defaults: { passengerId },
  });

  const updates = {};
  if (payload.preferred_gender !== undefined) updates.preferredGender = payload.preferred_gender;
  if (payload.smoking_preference !== undefined) updates.smokingPreference = payload.smoking_preference;
  if (payload.saved_routes !== undefined) updates.savedRoutes = payload.saved_routes;
  if (payload.national_id !== undefined) updates.nationalID = payload.national_id;
  if (payload.home_address !== undefined) updates.homeAddress = payload.home_address;
  if (payload.emergency_contacts !== undefined) updates.emergencyContacts = payload.emergency_contacts;

  if (Object.keys(updates).length === 0) {
    throw ApiErrors.validation('NO_UPDATABLE_FIELDS_PROVIDED');
  }

  await profile.update(updates);

  auditService.track({
    action: 'passenger_profile.updated',
    resourceType: 'passenger_profile',
    resourceId: profile.id,
    actorId: passengerId,
    actorType: 'passenger',
    payload: {
      fields: Object.keys(updates),
      created,
    },
  });

  return { passenger_profile: serializeProfile(profile) };
}

/**
 * Account summary for the caller's profile: penalties on the user mapped to
 * alerts/violations/sanctions plus complaints the user filed. Counts only,
 * returned as a typed array.
 */
async function getAccountSummary(passengerId) {
  const [alerts, violations, sanctions, complaints] = await Promise.all([
    Penalty.count({ where: { userId: passengerId, type: PENALTY_TYPES.WARNING } }),
    Penalty.count({ where: { userId: passengerId, penaltyType: 'violation' } }),
    Penalty.count({
      where: {
        userId: passengerId,
        type: { [Op.in]: [PENALTY_TYPES.SUSPENSION, PENALTY_TYPES.BAN] },
      },
    }),
    Complaint.count({ where: { reporterId: passengerId } }),
  ]);

  const summary = [
    { type: 'alerts', count: alerts },
    { type: 'violations', count: violations },
    { type: 'sanctions', count: sanctions },
    { type: 'complaints', count: complaints },
  ];

  auditService.track({
    action: 'passenger_account.summary_viewed',
    resourceType: 'passenger_profile',
    resourceId: passengerId,
    actorId: passengerId,
    actorType: 'passenger',
  });

  return { account_summary: summary };
}

module.exports = { getMyProfile, updateMyProfile, getAccountSummary };