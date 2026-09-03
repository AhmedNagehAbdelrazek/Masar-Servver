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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const c = __importStar(require("../Controllers/favoriteController"));
const v = __importStar(require("../utils/validators/favoriteValidator"));
router.use(protect_1.default);
router.get('/drivers', (0, roleGuard_1.roleGuard)(['passenger']), ...v.favoriteDriversListValidation, validatorMiddleware_1.default, c.listFavoriteDrivers);
router.post('/drivers', (0, roleGuard_1.roleGuard)(['passenger']), ...v.addFavoriteDriverValidation, validatorMiddleware_1.default, c.addFavoriteDriver);
router.delete('/drivers/:driver_id', (0, roleGuard_1.roleGuard)(['passenger']), ...v.driverParamValidation, c.removeFavoriteDriver);
router.get('/routes', (0, roleGuard_1.roleGuard)(['passenger']), c.listFavoriteRoutes);
router.post('/routes', (0, roleGuard_1.roleGuard)(['passenger']), ...v.addFavoriteRouteValidation, validatorMiddleware_1.default, c.addFavoriteRoute);
router.delete('/routes/:origin_city/:destination_city', (0, roleGuard_1.roleGuard)(['passenger']), ...v.routeParamValidation, c.removeFavoriteRoute);
exports.default = router;
module.exports = router;
//# sourceMappingURL=favoriteRoutes.js.map