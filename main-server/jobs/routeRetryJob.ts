import { Op } from 'sequelize';
import { Trip } from '../Models';
import { ROUTE_STATUS } from '../config/constants';
import routeService from '../Services/routeService';

export interface RouteRetryResult {
  retried: number;
  recovered: number;
  stillFailing: number;
}

// Retry trips stuck in pending/failed. computeTripRoute never throws for
// provider errors, so this loop is safe to run blind every tick.
// : no attempts column — the give-up rule is age-based (7 days).
// The */2 cron cadence is the retry throttle; old failures stay visible.
async function runRouteRetry(): Promise<RouteRetryResult> {
  const result: RouteRetryResult = { retried: 0, recovered: 0, stillFailing: 0 };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const trips = await (Trip as unknown as { findAll: (o: unknown) => Promise<Array<{ id: string }>> }).findAll({
    // : timestamp attrs are literally createdat/updatedat on this model.
    where: { routeStatus: { [Op.in]: [ROUTE_STATUS.PENDING, ROUTE_STATUS.FAILED] }, updatedat: { [Op.gt]: weekAgo } },
    attributes: ['id'],
    order: [['updatedat', 'ASC']],
    limit: 20,
  });
  for (const t of trips) {
    result.retried += 1;
    try {
      const out = await routeService.computeTripRoute(t.id);
      if (out.ok) result.recovered += 1;
      else result.stillFailing += 1;
    } catch (err) {
      result.stillFailing += 1;
      console.warn(`[routeRetryJob] trip ${t.id} failed:`, (err as Error).message);
    }
  }
  if (result.stillFailing > 0) {
    console.warn(`[routeRetryJob] ${result.stillFailing} trip(s) still without a route`);
  }
  return result;
}

export { runRouteRetry };
export default { runRouteRetry };
module.exports = { runRouteRetry };
