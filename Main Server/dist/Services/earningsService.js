"use strict";
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Booking, Trip } = require('../Models');
const { BOOKING_STATUS } = require('../config/constants');
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
    const bucketExpr = sequelize.fn('to_char', sequelize.fn('date_trunc', truncated, sequelize.col('Booking.createdat')), fmt);
    const rows = await Booking.findAll({
        attributes: [
            [bucketExpr, 'bucket'],
            [sequelize.fn('SUM', sequelize.col('Booking.agreed_fare')), 'earnings'],
            [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Booking.trip_id'))), 'trips'],
        ],
        include: [
            {
                model: Trip,
                as: 'trip',
                where: { driverId },
                attributes: [],
            },
        ],
        where: {
            status: BOOKING_STATUS.COMPLETED,
            createdat: { [Op.gte]: fromDate, [Op.lte]: toDate },
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
//# sourceMappingURL=earningsService.js.map