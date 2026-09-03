"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.listByDriver = void 0;
// @ts-nocheck
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const auditService_1 = __importDefault(require("./auditService"));
const listByDriver = async (driverId) => {
    const vehicles = await Models_1.Vehicle.findAll({
        where: { driver_id: driverId },
        order: [['createdat', 'DESC']],
    });
    const result = vehicles.map((v) => ({
        id: v.id,
        manufacturer: v.manufacturer,
        model: v.model,
        vehicle_type: v.vehicleType,
        model_year: v.modelYear,
        plate_number: v.plateNumber,
        code_number: v.codeNumber,
        color: v.color,
        seats: v.seats,
        is_verified: v.isVerified,
    }));
    return { vehicles: result };
};
exports.listByDriver = listByDriver;
const update = async (driverId, vehicleId, payload) => {
    const vehicle = await Models_1.Vehicle.findByPk(vehicleId);
    if (!vehicle)
        throw ApiError_1.ApiErrors.notFound('VEHICLE_NOT_FOUND');
    if (vehicle.driverId !== driverId)
        throw ApiError_1.ApiErrors.forbidden('YOU_CAN_ONLY_UPDATE_YOUR_OWN_VEHICLES');
    const updates = {};
    if (payload.manufacturer !== undefined)
        updates.manufacturer = payload.manufacturer;
    if (payload.model !== undefined)
        updates.model = payload.model;
    if (payload.vehicle_type !== undefined)
        updates.vehicleType = payload.vehicle_type;
    if (payload.model_year !== undefined)
        updates.modelYear = payload.model_year;
    if (payload.plate_number !== undefined)
        updates.plateNumber = payload.plate_number;
    if (payload.code_number !== undefined)
        updates.codeNumber = payload.code_number;
    if (payload.color !== undefined)
        updates.color = payload.color;
    if (payload.seats !== undefined)
        updates.seats = payload.seats;
    if (updates.plateNumber !== undefined && updates.plateNumber !== vehicle.plateNumber) {
        const existing = await Models_1.Vehicle.findOne({ where: { plate_number: updates.plateNumber } });
        if (existing && existing.id !== vehicle.id)
            throw ApiError_1.ApiErrors.conflict('PLATE_NUMBER_ALREADY_IN_USE');
    }
    await vehicle.update(updates);
    auditService_1.default.track({
        action: 'vehicle.updated',
        resourceType: 'vehicle',
        resourceId: vehicle.id,
        resourceLabel: vehicle.plateNumber,
        actorId: driverId,
        actorType: 'driver',
        payload: { fields: Object.keys(updates) },
    });
    return {
        vehicle: {
            id: vehicle.id,
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            vehicle_type: vehicle.vehicleType,
            model_year: vehicle.modelYear,
            plate_number: vehicle.plateNumber,
            code_number: vehicle.codeNumber,
            color: vehicle.color,
            seats: vehicle.seats,
            is_verified: vehicle.isVerified,
        },
    };
};
exports.update = update;
module.exports = { listByDriver, update };
exports.default = module.exports;
//# sourceMappingURL=vehicleService.js.map