"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceStorage = void 0;
exports.getTraceContext = getTraceContext;
const node_async_hooks_1 = require("node:async_hooks");
exports.traceStorage = new node_async_hooks_1.AsyncLocalStorage();
function getTraceContext() {
    return exports.traceStorage.getStore();
}
//# sourceMappingURL=context.js.map