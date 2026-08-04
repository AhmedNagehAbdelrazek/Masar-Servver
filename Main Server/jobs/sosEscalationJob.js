const { runEscalation } = require('../Services/sosService');

/**
 * Re-alerts unresolved SOS events every 60s and bumps escalation to
 * high priority after 5 minutes unresolved (Requirement 6). Tested directly
 * (cron is disabled under NODE_ENV=test).
 */
async function runSosEscalation() {
  const { alerted, escalated } = await runEscalation();
  return { alerted, escalated };
}

module.exports = { runSosEscalation };
