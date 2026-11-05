"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersionsDir = exports.runMigrations = void 0;
const runner_1 = require("./runner");
Object.defineProperty(exports, "runMigrations", { enumerable: true, get: function () { return runner_1.runMigrations; } });
Object.defineProperty(exports, "getVersionsDir", { enumerable: true, get: function () { return runner_1.getVersionsDir; } });
exports.default = { runMigrations: runner_1.runMigrations, getVersionsDir: runner_1.getVersionsDir };
module.exports = { runMigrations: runner_1.runMigrations, getVersionsDir: runner_1.getVersionsDir };
//# sourceMappingURL=index.js.map