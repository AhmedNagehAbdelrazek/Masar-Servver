// @ts-nocheck
import { Op } from 'sequelize';
import {
  DeletionRequest,
  DriverProfile,
  PassengerProfile,
  User,
  Vehicle,
} from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { DEV_PHONES, USER_STATUS, VERIFICATION_STATUS } from '../config/constants';
import { codes } from '../config/phoneCodes';
import { findByCountryCode, validatePhone } from '../utils/phoneValidator';
import { redis } from '../config/redis';
import { revokeUserSessions } from './authService';
import * as auditService from './auditService';
import * as adminAuditService from './adminAuditService';
import * as notificationService from './notificationService';
import * as devAccountService from './devAccountService';
import { blockAccountInventory } from './accountBlockingService';
import { revoke } from './enforcementService';

const DELETION_STATUSES = ['pending', 'approved'];
const EDITABLE_ROLES = ['passenger', 'driver'];

function dateValue(user) {
  return user.createdAt ?? user.createdat ?? null;
}

function canChangeRole(user) {
  return user.isVerified !== true && user.verificationStatus !== VERIFICATION_STATUS.APPROVED;
}

function roleLockedReason(user) {
  return canChangeRole(user) ? null : 'ROLE_CHANGE_NOT_ALLOWED_AFTER_VERIFICATION';
}

function shapeUser(user, extras = {}) {
  return {
    id: user.id,
    full_name: user.fullName ?? null,
    phone: user.phone,
    email: user.email ?? null,
    age: user.age == null ? null : Number(user.age),
    gender: user.gender ?? null,
    role: user.role,
    status: user.status,
    verification_status: user.verificationStatus ?? null,
    is_verified: user.isVerified === true,
    can_change_role: canChangeRole(user),
    role_locked_reason: roleLockedReason(user),
    is_dev_account: DEV_PHONES.includes(user.phone),
    can_delete: DEV_PHONES.includes(user.phone)
      || (canChangeRole(user) && EDITABLE_ROLES.includes(user.role)),
    created_at: dateValue(user),
    last_login_at: user.lastLoginAt ?? null,
    ...extras,
  };
}

async function profileFlags(userId) {
  const [driverProfile, passengerProfile, vehicle] = await Promise.all([
    DriverProfile.findOne({ where: { driverId: userId }, attributes: ['driverId'] }),
    PassengerProfile.findOne({ where: { passengerId: userId }, attributes: ['passengerId'] }),
    Vehicle.findOne({ where: { driverId: userId }, attributes: ['driverId'] }),
  ]);
  return {
    has_driver_profile: Boolean(driverProfile),
    has_passenger_profile: Boolean(passengerProfile),
    has_vehicle: Boolean(vehicle),
  };
}

async function hasActiveDeletion(userId) {
  const row = await DeletionRequest.findOne({
    where: { userId, status: { [Op.in]: DELETION_STATUSES } },
    attributes: ['id'],
  });
  return Boolean(row);
}

function resolvePhoneCountry(phone, fallbackCountryCode) {
  const clean = String(phone).replace(/[\s\-\.]/g, '');
  if (clean.startsWith('+')) {
    // Dial codes are 1-4 digits after the plus. Try the longest first so
    // +962 wins over +96 when both could match a prefix. Some entries in the
    // phone-code table have no `phone` array, so guard it here.
    for (let length = 4; length >= 1; length -= 1) {
      const prefix = clean.slice(0, length + 1);
      const country = codes.find((entry) =>
        Array.isArray(entry.phone)
        && entry.phone.some((dial) => dial.replace(/\s/g, '') === prefix)
      );
      if (country) return country;
    }
    return null;
  }
  return findByCountryCode(fallbackCountryCode);
}

function normalizePhone(phone, fallbackCountryCode) {
  const country = resolvePhoneCountry(phone, fallbackCountryCode);
  if (!country) {
    throw ApiErrors.validation('PHONE_NUMBER_MUST_BE_A_VALID_INTERNATIONAL_NUMBER');
  }
  const result = validatePhone(country.iso['alpha-2'], String(phone));
  if (!result.valid) {
    throw ApiErrors.validation('PHONE_NUMBER_MUST_BE_A_VALID_INTERNATIONAL_NUMBER');
  }
  return {
    phone: result.fullPhone,
    countryCode: result.countryCode,
  };
}

function normalizeEmail(email) {
  if (email === null || email === undefined || String(email).trim() === '') return null;
  return String(email).trim().toLowerCase();
}

async function revokeRefreshTokens(userId) {
  try {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    console.warn('[adminUserService] could not revoke refresh tokens:', err.message);
  }
}

async function getUser(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  const [extras, deleted] = await Promise.all([profileFlags(user.id), hasActiveDeletion(user.id)]);
  return {
    user: shapeUser(user, {
      ...extras,
      is_deleted: deleted,
      ...(deleted
        ? { can_change_role: false, can_delete: false, role_locked_reason: 'ACCOUNT_IS_DELETED' }
        : {}),
    }),
  };
}

async function updateUser(actorId, userId, payload = {}) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  if (await hasActiveDeletion(user.id)) throw ApiErrors.notFound('USER_NOT_FOUND');

  const updates = {};
  const changes = {};
  let roleChanged = false;

  if (payload.full_name !== undefined) {
    const fullName = payload.full_name == null ? null : String(payload.full_name).trim();
    if (fullName !== (user.fullName ?? null)) {
      updates.fullName = fullName;
      changes.full_name = { from: user.fullName ?? null, to: fullName };
    }
  }

  if (payload.phone !== undefined) {
    const normalized = normalizePhone(payload.phone, user.countryCode || 'JO');
    if (normalized.phone !== user.phone) {
      const existing = await User.findOne({
        where: { phone: normalized.phone, id: { [Op.ne]: user.id } },
        attributes: ['id'],
      });
      if (existing) throw ApiErrors.conflict('PHONE_ALREADY_IN_USE');
      updates.phone = normalized.phone;
      updates.countryCode = normalized.countryCode;
      changes.phone = { from: user.phone, to: normalized.phone };
    }
  }

  if (payload.email !== undefined) {
    const email = normalizeEmail(payload.email);
    if (email !== (user.email ?? null)) {
      if (email) {
        const existing = await User.findOne({
          where: { email, id: { [Op.ne]: user.id } },
          attributes: ['id'],
        });
        if (existing) throw ApiErrors.conflict('EMAIL_ALREADY_IN_USE');
      }
      updates.email = email;
      changes.email = { from: user.email ?? null, to: email };
    }
  }

  if (payload.age !== undefined) {
    const age = payload.age == null || payload.age === '' ? null : Number(payload.age);
    if (age !== (user.age == null ? null : Number(user.age))) {
      updates.age = age;
      changes.age = { from: user.age == null ? null : Number(user.age), to: age };
    }
  }

  if (payload.gender !== undefined) {
    const gender = payload.gender == null || payload.gender === '' ? null : String(payload.gender);
    if (gender !== (user.gender ?? null)) {
      updates.gender = gender;
      changes.gender = { from: user.gender ?? null, to: gender };
    }
  }

  if (payload.status !== undefined) {
    if (!Object.values(USER_STATUS).includes(payload.status)) {
      throw ApiErrors.validation('STATUS_MUST_BE_ONE_OF_ACTIVE_WARNED_SUSPENDED_BANNED');
    }
    updates.status = payload.status;
    if (payload.status !== user.status) {
      changes.status = { from: user.status, to: payload.status };

      if ([USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(payload.status)) {
        try {
          await blockAccountInventory(actorId, user, payload.reason || 'Account status updated by admin');
        } catch (err) {
          console.warn('[adminUserService] account inventory block failed:', err.message);
        }
        try {
          revoke(user.id, {
            action: payload.status === USER_STATUS.BANNED ? 'ban' : 'suspend',
            reason: payload.reason || 'Account status updated by admin',
            actorId,
          });
        } catch (err) {
          console.warn('[adminUserService] enforcement revoke failed:', err.message);
        }
      }
    }
  }

  if (payload.role !== undefined && payload.role !== user.role) {
    if (!EDITABLE_ROLES.includes(payload.role)) {
      throw ApiErrors.validation('ROLE_MUST_BE_PASSENGER_OR_DRIVER');
    }
    if (!EDITABLE_ROLES.includes(user.role)) {
      throw ApiErrors.forbidden('ONLY_PASSENGER_OR_DRIVER_ACCOUNTS_CAN_CHANGE_ROLE');
    }
    if (!canChangeRole(user)) {
      throw ApiErrors.forbidden('ROLE_CHANGE_NOT_ALLOWED_AFTER_VERIFICATION');
    }

    updates.role = payload.role;
    updates.isVerified = false;
    updates.verificationStatus = VERIFICATION_STATUS.UNVERIFIED;
    updates.verificationSubmittedAt = null;
    updates.verificationRejectedAt = null;
    updates.verificationRejectionReason = null;
    updates.verificationRejectionFields = [];
    roleChanged = true;
    changes.role = { from: user.role, to: payload.role };
    changes.verification_reset = true;
  }

  if (Object.keys(updates).length === 0) {
    throw ApiErrors.validation('NO_UPDATABLE_FIELDS_PROVIDED');
  }

  await user.update(updates);

  if (roleChanged || changes.status?.to === USER_STATUS.BANNED) {
    try {
      await revokeUserSessions(user.id);
    } catch (err) {
      console.warn('[adminUserService] session revocation failed:', err.message);
    }
  }

  if (roleChanged && payload.role === 'passenger') {
    try {
      await PassengerProfile.findOrCreate({
        where: { passengerId: user.id },
        defaults: { passengerId: user.id },
      });
    } catch (err) {
      console.warn('[adminUserService] passenger profile placeholder failed:', err.message);
    }
  }

  if (changes.status && payload.reason) {
    try {
      await notificationService.sendToUser(user, 'ADMIN_NOTICE', {
        channels: ['in_app'],
        vars: {
          title: 'تم تحديث حالة الحساب',
          body: `تم تغيير حالة حسابك إلى ${payload.status}. السبب: ${payload.reason}`,
        },
        data: { status: payload.status, reason: payload.reason },
      });
    } catch (err) {
      console.warn('[adminUserService] status notification failed:', err.message);
    }
  }

  if (roleChanged) {
    try {
      await notificationService.sendToUser(user, 'ADMIN_NOTICE', {
        channels: ['in_app'],
        vars: {
          title: 'تم تحديث دور الحساب',
          body: `تم تغيير دور حسابك إلى ${payload.role === 'driver' ? 'سائق' : 'راكب'}. يرجى إكمال بيانات الحساب من جديد.`,
        },
        data: { role: payload.role, verification_reset: true },
      });
    } catch (err) {
      console.warn('[adminUserService] role notification failed:', err.message);
    }
  }

  auditService.track({
    action: roleChanged ? 'user.role_changed' : 'user.updated',
    resourceType: 'user',
    resourceId: user.id,
    resourceLabel: user.phone,
    actorId,
    actorType: 'admin',
    payload: {
      changes,
      reason: payload.reason || null,
    },
  });

  await adminAuditService.record({
    actorId,
    userId: user.id,
    action: roleChanged
      ? 'role_changed'
      : changes.status
        ? 'status_changed'
        : 'profile_updated',
    before: null,
    after: changes,
    reason: payload.reason || null,
    source: 'admin_user_update',
  });

  const extras = await profileFlags(user.id);
  return {
    user: shapeUser(user, extras),
    role_changed: roleChanged,
    updated_by: actorId,
  };
}

async function softDeleteUser(actorId, user, reason) {
  const deleteReason = reason || 'Account deleted by admin';

  try {
    await blockAccountInventory(actorId, user, deleteReason);
  } catch (err) {
    console.warn('[adminUserService] account inventory block failed:', err.message);
  }

  try {
    await notificationService.sendToUser(user, 'ACCOUNT_BANNED', {
      channels: ['in_app', 'push'],
      vars: { reason: deleteReason },
      data: { deleted: true, reason: deleteReason },
    });
  } catch (err) {
    console.warn('[adminUserService] deletion notification failed:', err.message);
  }

  await user.update({
    status: USER_STATUS.BANNED,
    fcmToken: null,
  });

  const existing = await DeletionRequest.findOne({
    where: {
      userId: user.id,
      status: { [Op.in]: DELETION_STATUSES },
    },
  });
  if (existing) {
    await existing.update({
      status: 'approved',
      reviewNotes: deleteReason,
      reviewedBy: actorId,
      estimatedCompletion: new Date(),
    });
  } else {
    await DeletionRequest.create({
      userId: user.id,
      reason: deleteReason,
      status: 'approved',
      reviewNotes: deleteReason,
      reviewedBy: actorId,
      estimatedCompletion: new Date(),
    });
  }

  try {
    revoke(user.id, { action: 'ban', reason: deleteReason, actorId });
  } catch (err) {
    console.warn('[adminUserService] enforcement revoke failed:', err.message);
  }
  await revokeRefreshTokens(user.id);
  try {
    await revokeUserSessions(user.id);
  } catch (err) {
    console.warn('[adminUserService] session revocation failed:', err.message);
  }

  auditService.track({
    action: 'user.deleted',
    resourceType: 'user',
    resourceId: user.id,
    resourceLabel: user.phone,
    actorId,
    actorType: 'admin',
    payload: { mode: 'soft', reason: deleteReason },
  });

  await adminAuditService.record({
    actorId,
    userId: user.id,
    action: 'account_deleted',
    before: { status: user.status },
    after: { status: USER_STATUS.BANNED },
    reason: deleteReason,
    source: 'admin_user_delete',
  });

  return {
    deleted: true,
    mode: 'soft',
    message: 'ACCOUNT_DELETED_SUCCESSFULLY',
    user: { id: user.id, status: user.status },
  };
}

async function deleteUser(actorId, userId, payload = {}) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  if (user.id === actorId) throw ApiErrors.forbidden('CANNOT_DELETE_YOUR_OWN_ACCOUNT');
  if (await hasActiveDeletion(user.id)) {
    return {
      deleted: true,
      mode: 'soft',
      message: 'ACCOUNT_DELETED_SUCCESSFULLY',
      user: { id: user.id, status: user.status },
    };
  }
  if (!EDITABLE_ROLES.includes(user.role)) {
    throw ApiErrors.forbidden('ONLY_PASSENGER_OR_DRIVER_ACCOUNTS_CAN_BE_DELETED');
  }

  if (DEV_PHONES.includes(user.phone)) {
    const result = await devAccountService.permanentlyDeleteDevUser(userId, actorId);
    auditService.track({
      action: 'user.permanent_delete',
      resourceType: 'user',
      resourceId: user.id,
      resourceLabel: user.phone,
      actorId,
      actorType: 'admin',
      payload: { mode: 'developer_history_purge', reason: payload.reason || null },
    });
    return { ...result, mode: 'permanent' };
  }

  if (!canChangeRole(user)) {
    throw ApiErrors.forbidden('VERIFIED_ACCOUNTS_CANNOT_BE_DELETED');
  }

  return softDeleteUser(actorId, user, payload.reason);
}

export {
  getUser,
  updateUser,
  deleteUser,
  softDeleteUser,
  canChangeRole,
  shapeUser,
};

export default {
  getUser,
  updateUser,
  deleteUser,
  softDeleteUser,
  canChangeRole,
  shapeUser,
};
module.exports = {
  getUser,
  updateUser,
  deleteUser,
  softDeleteUser,
  canChangeRole,
  shapeUser,
};
