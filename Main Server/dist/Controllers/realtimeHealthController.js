"use strict";
const realtimeMetrics = require('../Services/realtimeMetrics');
const { getIO } = require('../socketServer');
const catchAsync = require('../utils/catchAsync');
/**
 * Public realtime health snapshot (contracts/metrics-contracts.md). Public so
 * ops load-balancers and monitoring can poll it without auth.
 */
const realtimeHealth = catchAsync(async (req, res) => {
    const snapshot = realtimeMetrics.getSnapshot(getIO());
    res.status(200).json(snapshot);
});
module.exports = { realtimeHealth };
//# sourceMappingURL=realtimeHealthController.js.map