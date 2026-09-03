"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_MESSAGES = exports.VALIDATION_MESSAGES = exports.MESSAGES = void 0;
const app_1 = require("./app");
Object.defineProperty(exports, "APP_MESSAGES", { enumerable: true, get: function () { return app_1.APP_MESSAGES; } });
const validation_1 = require("./validation");
Object.defineProperty(exports, "VALIDATION_MESSAGES", { enumerable: true, get: function () { return validation_1.VALIDATION_MESSAGES; } });
exports.MESSAGES = app_1.APP_MESSAGES;
exports.default = { MESSAGES: exports.MESSAGES, VALIDATION_MESSAGES: validation_1.VALIDATION_MESSAGES };
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { MESSAGES: exports.MESSAGES, VALIDATION_MESSAGES: validation_1.VALIDATION_MESSAGES };
    // @ts-ignore
    module.exports.MESSAGES = exports.MESSAGES;
    // @ts-ignore
    module.exports.VALIDATION_MESSAGES = validation_1.VALIDATION_MESSAGES;
    // @ts-ignore
    module.exports.default = { MESSAGES: exports.MESSAGES, VALIDATION_MESSAGES: validation_1.VALIDATION_MESSAGES };
}
//# sourceMappingURL=index.js.map