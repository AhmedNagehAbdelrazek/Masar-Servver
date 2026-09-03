"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSearch = recordSearch;
exports.getRecent = getRecent;
// @ts-nocheck
const Models_1 = require("../Models");
const redisKeys_1 = require("../utils/redisKeys");
const redis_1 = require("../config/redis");
/**
 * Upsert the passenger's most recent search for a route. Because there is a
 * unique index on (passenger_id, origin_city, destination_city), the same
 * route simply refreshes its `searched_on` date instead of creating a new row.
 */
async function recordSearch(passengerId, originCity, destinationCity) {
    const searchedOn = new Date().toISOString().split('T')[0];
    const existing = await Models_1.RecentSearch.findOne({
        where: { passengerId, originCity, destinationCity },
    });
    if (existing) {
        await existing.update({ searchedOn });
    }
    else {
        await Models_1.RecentSearch.create({ passengerId, originCity, destinationCity, searchedOn });
    }
    // Best-effort: keep the passenger home cache fresh after a new search.
    try {
        await (0, redis_1.deleteKey)(redisKeys_1.REDIS_KEYS.PASSENGER_HOME(passengerId));
    }
    catch (err) {
        console.warn('[recentSearchService] cache invalidation failed:', err.message);
    }
    return { passengerId, originCity, destinationCity, searchedOn };
}
/**
 * The passenger's most recent distinct searched routes (max `limit`), ordered
 * by most recently searched. Returns [] when nothing has been searched yet.
 */
async function getRecent(passengerId, limit = 5) {
    const rows = await Models_1.RecentSearch.findAll({
        where: { passengerId },
        order: [['searched_on', 'DESC'], ['createdat', 'DESC']],
        limit,
    });
    return rows.map((r) => ({
        id: r.id,
        origin_city: r.originCity,
        destination_city: r.destinationCity,
        searched_on: r.searchedOn,
    }));
}
module.exports = { recordSearch, getRecent };
exports.default = module.exports;
//# sourceMappingURL=recentSearchService.js.map