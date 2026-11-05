"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregate = aggregate;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const PERIOD_TRUNC = {
    day: 'day',
    week: 'week',
    month: 'month',
};
/**
 * Aggregate earnings from completed bookings on a driver's trips (contract
 * D9). Informational only — no payment side-effects. Grouped by day/week/
 * month using Postgres `date_trunc`. Buckets are rendered as YYYY-MM-DD
 * (day/week) or YYYY-MM (month).
 */
async function aggregate(driverId, { period = 'month', from, to } = {}) {
    const truncated = PERIOD_TRUNC[period] || PERIOD_TRUNC.month;
    const now = new Date();
    let fromDate = from ? new Date(from) : null;
    let toDate = to ? new Date(to) : null;
    if (!fromDate) {
        fromDate = new Date(now);
        if (truncated === 'day')
            fromDate.setHours(0, 0, 0, 0);
        else if (truncated === 'week')
            fromDate.setDate(now.getDate() - 7);
        else
            fromDate.setMonth(now.getMonth() - 1);
    }
    if (!toDate)
        toDate = new Date(now);
    const fmt = truncated === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
    const bucketExpr = database_1.default.fn('to_char', database_1.default.fn('date_trunc', truncated, database_1.default.col('Booking.createdat')), fmt);
    const rows = await Models_1.Booking.findAll({
        attributes: [
            [bucketExpr, 'bucket'],
            [database_1.default.fn('SUM', database_1.default.col('Booking.agreed_fare')), 'earnings'],
            [database_1.default.fn('COUNT', database_1.default.fn('DISTINCT', database_1.default.col('Booking.trip_id'))), 'trips'],
        ],
        include: [
            {
                model: Models_1.Trip,
                as: 'trip',
                where: { driverId },
                attributes: [],
            },
        ],
        where: {
            status: constants_1.BOOKING_STATUS.COMPLETED,
            createdat: { [sequelize_1.Op.gte]: fromDate, [sequelize_1.Op.lte]: toDate },
        },
        group: [bucketExpr],
        raw: true,
        order: [[bucketExpr, 'ASC']],
    });
    const total = rows.reduce((sum, r) => sum + Number(r.earnings || 0), 0);
    const breakdown = rows.map((r) => ({
        bucket: r.bucket,
        earnings: Number(r.earnings || 0),
        trips: Number(r.trips || 0),
    }));
    return {
        period: truncated,
        currency: 'JOD',
        total: Math.round(total * 100) / 100,
        breakdown,
    };
}
module.exports = { aggregate };
exports.default = module.exports;
//# sourceMappingURL=earningsService.js.map