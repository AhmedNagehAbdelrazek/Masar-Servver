"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const db_1 = __importDefault(require("./db"));
async function migrate() {
    const migrationPath = (0, node_path_1.resolve)(__dirname, '../migrations/001_init.sql');
    const sql = (0, node_fs_1.readFileSync)(migrationPath, 'utf8');
    console.log('[migrate] Running migration...');
    await db_1.default.query(sql);
    console.log('[migrate] Done.');
    await db_1.default.end();
}
migrate().catch((err) => {
    console.error('[migrate] Failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map