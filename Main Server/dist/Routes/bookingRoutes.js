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
const c = __importStar(require("../Controllers/bookingController"));
const v = __importStar(require("../utils/validators/bookingValidator"));
router.use(protect_1.default);
router.get('/', (0, roleGuard_1.roleGuard)(['passenger']), ...v.passengerBookingListValidation, validatorMiddleware_1.default, c.listMyBookings);
router.post('/', (0, roleGuard_1.roleGuard)(['passenger']), ...v.createBookingValidation, validatorMiddleware_1.default, c.createBooking);
router.get('/:booking_id', (0, roleGuard_1.roleGuard)(['passenger']), ...v.cancelBookingValidation, c.getBooking);
// Driver reveal for a confirmed booking (passenger owner, trip driver, or admin)
router.get('/:booking_id/driver-profile', ...v.cancelBookingValidation, validatorMiddleware_1.default, c.getDriverProfile);
router.put('/:booking_id/cancel', (0, roleGuard_1.roleGuard)(['passenger']), ...v.cancelBookingValidation, c.cancelBooking);
router.post('/:booking_id/delay', ...v.reportDelayValidation, validatorMiddleware_1.default, c.reportDelay);
router.get('/:booking_id/delays', ...v.delayListValidation, validatorMiddleware_1.default, c.listDelays);
exports.default = router;
module.exports = router;
//# sourceMappingURL=bookingRoutes.js.map