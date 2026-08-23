const realtimeMetrics = require('../Services/realtimeMetrics');
const { getIO } = require('../socketServer');

/**
 * Public realtime health snapshot (contracts/metrics-contracts.md). Public so
 * ops load-balancers and monitoring can poll it without auth.
 */
const realtimeHealth = (req, res) => {
  const snapshot = realtimeMetrics.getSnapshot(getIO());
  res.status(200).json(snapshot);
};

module.exports = { realtimeHealth };
