"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const initDb_1 = require("./initDb");
async function main() {
    await (0, initDb_1.ensureDatabase)();
    await (0, initDb_1.migrate)();
}
main().catch((err) => {
    console.error('[migrate] Failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map