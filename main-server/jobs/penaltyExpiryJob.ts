// @ts-nocheck
import { Op } from 'sequelize';
import { Penalty, User } from '../Models';
import { PENALTY_TYPES, USER_STATUS } from '../config/constants';
import notificationService from '../Services/notificationService';

/**
 * Temporary suspensions carry an `ends_at`; without this sweep the account
 * stays suspended forever because auth checks users.status, not penalty
 * windows. Reactivate only when no other active suspension or ban remains.
 */
async function runPenaltyExpiry() {
  const now = new Date();
  const expired = await Penalty.findAll({
    where: { type: PENALTY_TYPES.SUSPENSION, endsAt: { [Op.lte]: now } },
    attributes: ['userId'],
    raw: true,
  });
  const userIds = [...new Set(expired.map((row) => row.userId).filter(Boolean))];
  const reactivated = [];

  for (const userId of userIds) {
    const user = await User.findByPk(userId);
    if (!user || user.status !== USER_STATUS.SUSPENDED) continue;

    const [activeBans, activeSuspensions] = await Promise.all([
      Penalty.count({ where: { userId, type: PENALTY_TYPES.BAN, endsAt: null } }),
      Penalty.count({
        where: {
          userId,
          type: PENALTY_TYPES.SUSPENSION,
          [Op.or]: [
            { endsAt: { [Op.is]: null } },
            { endsAt: { [Op.gt]: now } },
          ],
        },
      }),
    ]);
    if (activeBans > 0 || activeSuspensions > 0) continue;

    await user.update({ status: USER_STATUS.ACTIVE });
    reactivated.push(userId);
    try {
      await notificationService.sendToUser(user, 'ACCOUNT_REACTIVATED', {
        channels: ['in_app', 'push', 'sms'],
        data: { source: 'suspension_expiry' },
      });
    } catch (err) {
      console.warn('[penaltyExpiryJob] notification failed:', err.message);
    }
  }

  return { reactivated: reactivated.length, userIds: reactivated };
}

module.exports = { runPenaltyExpiry };
export { runPenaltyExpiry };
export default module.exports;
