"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFavoriteRoutes = exports.removeFavoriteRoute = exports.addFavoriteRoute = exports.listFavoriteDrivers = exports.removeFavoriteDriver = exports.addFavoriteDriver = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const favoriteService = __importStar(require("../Services/favoriteService"));
const auditService = __importStar(require("../Services/auditService"));
const addFavoriteDriver = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id } = req.body;
    const result = await favoriteService.addFavoriteDriver(String(authReq.user?.id), driver_id);
    auditService.markResource(res, { type: 'favorite_driver', id: result.favorite_driver.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.addFavoriteDriver = addFavoriteDriver;
const removeFavoriteDriver = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id } = req.params;
    const result = await favoriteService.removeFavoriteDriver(String(authReq.user?.id), driver_id);
    auditService.markResource(res, { type: 'favorite_driver', id: driver_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.removeFavoriteDriver = removeFavoriteDriver;
const listFavoriteDrivers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await favoriteService.listFavoriteDrivers(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listFavoriteDrivers = listFavoriteDrivers;
const addFavoriteRoute = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const favoriteRoute = await favoriteService.addFavoriteRoute(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'favorite_route', id: favoriteRoute.id });
    (0, httpResponse_1.successResponse)(res, { favorite_route: favoriteRoute }, 201);
});
exports.addFavoriteRoute = addFavoriteRoute;
const removeFavoriteRoute = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { origin_city, destination_city } = req.params;
    const result = await favoriteService.removeFavoriteRoute(String(authReq.user?.id), origin_city, destination_city);
    auditService.markResource(res, { type: 'favorite_route', id: `${origin_city}->${destination_city}` });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.removeFavoriteRoute = removeFavoriteRoute;
const listFavoriteRoutes = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await favoriteService.listFavoriteRoutes(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listFavoriteRoutes = listFavoriteRoutes;
exports.default = { addFavoriteDriver, removeFavoriteDriver, listFavoriteDrivers, addFavoriteRoute, removeFavoriteRoute, listFavoriteRoutes };
//# sourceMappingURL=favoriteController.js.map