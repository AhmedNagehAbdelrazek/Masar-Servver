"use strict";
const { Op } = require('sequelize');
const { Complaint, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { COMPLAINT_STATUS } = require('../config/constants');
const { parsePagination, buildPagination } = require('../utils/pagination');
const auditService = require('./auditService');
function serializeCreate(complaint) {
    return {
        id: complaint.id,
        accused_id: complaint.accusedId,
        category: complaint.category,
        status: complaint.status,
        created_at: complaint.createdat || complaint.createdAt,
    };
}
function serializeAdmin(complaint) {
    return {
        id: complaint.id,
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        reporter_name: complaint.reporter ? complaint.reporter.fullName : null,
        accused_name: complaint.accused ? complaint.accused.fullName : null,
        booking_id: complaint.bookingId,
        evidence_urls: complaint.evidenceUrls,
        created_at: complaint.createdat || complaint.createdAt,
    };
}
function serializeDriver(complaint, direction) {
    return {
        id: complaint.id,
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        direction,
        other_party: direction === 'filed'
            ? (complaint.accused ? complaint.accused.fullName : null)
            : (complaint.reporter ? complaint.reporter.fullName : null),
        evidence_urls: complaint.evidenceUrls,
        created_at: complaint.createdat || complaint.createdAt,
    };
}
/**
 * File a complaint (contract S1). Idempotent: skips creation when an open
 * complaint already matches the same reporter/accused/booking/category.
 */
async function create(reporterId, data) {
    const accused = await User.findByPk(data.accused_id);
    if (!accused)
        throw ApiErrors.notFound('ACCUSED_USER_NOT_FOUND');
    const existing = await Complaint.findOne({
        where: {
            reporterId,
            accusedId: data.accused_id,
            bookingId: data.booking_id || null,
            category: data.category,
            status: COMPLAINT_STATUS.OPEN,
        },
    });
    if (existing) {
        return { complaint: serializeCreate(existing), already_filed: true };
    }
    const complaint = await Complaint.create({
        bookingId: data.booking_id || null,
        reporterId,
        accusedId: data.accused_id,
        category: data.category,
        description: data.description,
        evidenceUrls: data.evidence_urls || [],
        status: COMPLAINT_STATUS.OPEN,
    });
    auditService.track({
        action: 'complaint.filed',
        resourceType: 'complaint',
        resourceId: complaint.id,
        actorId: reporterId,
        actorType: 'user',
        payload: {
            accused_id: data.accused_id,
            category: data.category,
            booking_id: data.booking_id || null,
        },
    });
    return { complaint: serializeCreate(complaint), already_filed: false };
}
/**
 * Driver view of complaints filed by or against them (contract D8).
 */
async function listForDriver(userId, filters = {}) {
    const { direction, status } = filters;
    const { page, limit, offset } = parsePagination(filters);
    const where = {};
    if (direction === 'filed')
        where.reporterId = userId;
    else if (direction === 'against')
        where.accusedId = userId;
    else
        where[Op.or] = [{ reporterId: userId }, { accusedId: userId }];
    if (status)
        where.status = status;
    const { rows, count } = await Complaint.findAndCountAll({
        where,
        include: [
            { model: User, as: 'reporter', attributes: ['id', 'fullName'] },
            { model: User, as: 'accused', attributes: ['id', 'fullName'] },
        ],
        order: [['createdat', 'DESC']],
        offset,
        limit,
    });
    return {
        data: rows.map((c) => {
            const dir = c.reporterId === userId ? 'filed' : 'against';
            return serializeDriver(c, dir);
        }),
        pagination: buildPagination(count, page, limit),
    };
}
/**
 * Admin list of all complaints (contract A9).
 */
async function listAdmin(filters = {}) {
    const { status, category } = filters;
    const { page, limit, offset } = parsePagination(filters);
    const where = {};
    if (status)
        where.status = status;
    if (category)
        where.category = category;
    const { rows, count } = await Complaint.findAndCountAll({
        where,
        include: [
            { model: User, as: 'reporter', attributes: ['id', 'fullName'] },
            { model: User, as: 'accused', attributes: ['id', 'fullName'] },
        ],
        order: [['createdat', 'DESC']],
        offset,
        limit,
    });
    return {
        data: rows.map(serializeAdmin),
        pagination: buildPagination(count, page, limit),
    };
}
/**
 * Admin resolve/dismiss a complaint (contract A10).
 */
async function resolve(adminId, complaintId, data) {
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint)
        throw ApiErrors.notFound('COMPLAINT_NOT_FOUND');
    const fields = { status: data.status };
    if (data.status === COMPLAINT_STATUS.RESOLVED) {
        fields.resolution = data.resolution;
        fields.resolvedBy = adminId;
        fields.resolvedAt = new Date();
    }
    if (data.status === COMPLAINT_STATUS.DISMISSED) {
        fields.resolution = data.resolution || 'Complaint dismissed';
        fields.resolvedBy = adminId;
        fields.resolvedAt = new Date();
    }
    await complaint.update(fields);
    return {
        complaint: {
            id: complaint.id,
            status: complaint.status,
            resolution: complaint.resolution,
            resolved_by: complaint.resolvedBy,
            resolved_at: complaint.resolvedAt,
        },
    };
}
module.exports = { create, listForDriver, listAdmin, resolve };
//# sourceMappingURL=complaintService.js.map