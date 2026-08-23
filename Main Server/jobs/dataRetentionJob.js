const { Op } = require('sequelize');
const { TripLocation, Message } = require('../Models');

const LOCATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (clarified Q4)
const MESSAGE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year (clarified Q4)

/**
 * Purges expiring realtime data. SOS events and penalties are retained
 * long-term for audit; only trip_locations (30d) and messages (1y) are
 * pruned. Runs on a schedule in production; exercised directly in tests.
 */
async function runDataRetention() {
  const now = Date.now();
  const results = {};

  const locationCutoff = new Date(now - LOCATION_RETENTION_MS);
  const messageCutoff = new Date(now - MESSAGE_RETENTION_MS);

  results.locationsDeleted = await TripLocation.destroy({
    where: { createdat: { [Op.lt]: locationCutoff } },
  });

  results.messagesDeleted = await Message.destroy({
    where: { createdat: { [Op.lt]: messageCutoff } },
  });

  return results;
}

module.exports = { runDataRetention, LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
