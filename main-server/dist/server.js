"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socketServer_1 = require("./socketServer");
const database_1 = require("./config/database");
const jobs_1 = require("./jobs");
const seed_1 = require("./seed");
const seed_mock_1 = require("./seed-mock");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = (0, app_1.default)();
const httpServer = http_1.default.createServer(app);
(0, socketServer_1.createSocketServer)(httpServer);
async function startServer() {
    await (0, database_1.initDatabase)();
    await (0, seed_1.seedAdmin)();
    await (0, seed_mock_1.seedMockData)();
    (0, jobs_1.startJobs)();
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
exports.default = app;
module.exports = app;
//# sourceMappingURL=server.js.map