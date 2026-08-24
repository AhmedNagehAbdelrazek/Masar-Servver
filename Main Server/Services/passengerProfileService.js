const { PassengerProfile } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const auditService = require('./auditService');

function serializeProfile(profile) {
  return {
    id: profile.id,
    passenger_id: profile.passengerId,
    preferred_gender: profile.preferredGender,
    smoking_preference: profile.smokingPreference,
    saved_routes: profile.savedRoutes || [],
    emergency_contacts: profile.emergencyContacts || [],
    created_at: profile.createdat || profile.createdAt,
    updated_at: profile.updatedat || profile.updatedAt,
  };
}

async function getMyProfile(passengerId) {
  const [profile] = await PassengerProfile.findOrCreate({
    where: { passengerId },
    defaults: { passengerId },
  });
  return { passenger_profile: serializeProfile(profile) };
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

module.exports = { getMyProfile, updateMyProfile };
