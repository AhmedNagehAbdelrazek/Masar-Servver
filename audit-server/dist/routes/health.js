"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRouter = createHealthRouter;
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
function createHealthRouter() {
    const router = express_1.default.Router();
    router.get('/health', (_req, res) => {
        res.json({ status: 'ok', uptime: process.uptime() });
    });
    router.get('/ready', async (_req, res) => {
        try {
            await db_1.default.query('SELECT 1');
            res.json({ status: 'ready' });
        }
        catch {
            res.status(503).json({ status: 'not ready' });
        }
    });
    return router;
}
//# sourceMappingURL=health.js.map