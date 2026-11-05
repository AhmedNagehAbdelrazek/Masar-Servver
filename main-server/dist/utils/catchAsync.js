"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.catchAsync = catchAsync;
exports.default = catchAsync;
// CommonJS compatibility: `const catchAsync = require('../utils/catchAsync')` should be the function itself
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = catchAsync;
    // @ts-ignore
    module.exports.default = catchAsync;
    // @ts-ignore
    module.exports.catchAsync = catchAsync;
}
//# sourceMappingURL=catchAsync.js.map