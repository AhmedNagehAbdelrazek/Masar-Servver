"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDriverUser = loadDriverUser;
exports.ensureReadable = ensureReadable;
exports.ensureOperational = ensureOperational;
const Models_1 = require("../Models");
const ApiError_1 = require("./ApiError");
const constants_1 = require("../config/constants");
const UserModelTyped = Models_1.User;
async function loadDriverUser(userId) {
    const user = await UserModelTyped.findByPk(userId);
    if (!user)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    return user;
}
function ensureReadable(user) {
    if (user.status === constants_1.USER_STATUS.BANNED) {
        throw ApiError_1.ApiErrors.forbidden('ACCOUNT_IS_BANNED');
    }
}
function ensureOperational(user) {
    if (user.status === constants_1.USER_STATUS.BANNED) {
        throw ApiError_1.ApiErrors.forbidden('ACCOUNT_IS_BANNED');
    }
    if (user.status === constants_1.USER_STATUS.SUSPENDED) {
        throw ApiError_1.ApiErrors.forbidden('SUSPENDED_ACCOUNTS_CANNOT_PERFORM_THIS_ACTION');
    }
}
const userAccess = { loadDriverUser, ensureReadable, ensureOperational };
exports.default = userAccess;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { loadDriverUser, ensureReadable, ensureOperational };
    // @ts-ignore
    module.exports.loadDriverUser = loadDriverUser;
    // @ts-ignore
    module.exports.ensureReadable = ensureReadable;
    // @ts-ignore
    module.exports.ensureOperational = ensureOperational;
    // @ts-ignore
    module.exports.default = userAccess;
}
//# sourceMappingURL=userAccess.js.map