"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMigrations = exports.runMigrations = void 0;
const runner_1 = require("./main/runner");
Object.defineProperty(exports, "runMigrations", { enumerable: true, get: function () { return runner_1.runMigrations; } });
const init_1 = require("./scripts/init");
Object.defineProperty(exports, "initMigrations", { enumerable: true, get: function () { return init_1.initMigrations; } });
exports.default = { runMigrations: runner_1.runMigrations, initMigrations: init_1.initMigrations };
module.exports = { runMigrations: runner_1.runMigrations, initMigrations: init_1.initMigrations };
//# sourceMappingURL=index.js.map