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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraceContext = exports.createAuditedFetch = exports.createAuditMiddleware = exports.AuditClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "AuditClient", { enumerable: true, get: function () { return client_1.AuditClient; } });
var express_1 = require("./express");
Object.defineProperty(exports, "createAuditMiddleware", { enumerable: true, get: function () { return express_1.createAuditMiddleware; } });
var http_1 = require("./http");
Object.defineProperty(exports, "createAuditedFetch", { enumerable: true, get: function () { return http_1.createAuditedFetch; } });
var context_1 = require("./context");
Object.defineProperty(exports, "getTraceContext", { enumerable: true, get: function () { return context_1.getTraceContext; } });
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map