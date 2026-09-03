"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
require("./Models/index");
const index_1 = __importDefault(require("./Routes/index"));
const globalErrorHandler_1 = __importDefault(require("./middlewares/globalErrorHandler"));
const audit_client_1 = require("./external packages/audit-client");
const audit_1 = require("./config/audit");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    app.use((0, audit_client_1.createAuditMiddleware)(audit_1.audit, {
        skip: (req) => req.method === 'GET' || req.path === '/health',
    }));
    app.use((0, morgan_1.default)('short'));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use('/uploads', 
    // express.static(process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, 'uploads'))
    express_1.default.static(path_1.default.join(__dirname, 'uploads')));
    app.use('/api', index_1.default);
    app.use((req, res) => {
        res.status(404).json({
            status: 'error',
            message: `Route ${req.method} ${req.originalUrl} not found`,
            code: 'ROUTE_NOT_FOUND',
        });
    });
    app.use(globalErrorHandler_1.default);
    return app;
}
exports.default = createApp;
module.exports = createApp;
//# sourceMappingURL=app.js.map