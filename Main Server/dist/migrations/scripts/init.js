"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMigrations = initMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("../main/connection");
const runner_1 = require("../main/runner");
const MIGRATIONS_ROOT = path_1.default.join(__dirname, '..');
const VERSIONS_DIR = path_1.default.join(MIGRATIONS_ROOT, 'versions');
function pad(n) {
    return String(n).padStart(3, '0');
}
function cleanName(filename) {
    return filename
        .replace(/^\d+-/, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_.-]/g, '')
        .replace(/_+/g, '_');
}
async function initMigrations() {
    console.log('[init] Setting up migration system...');
    if (!fs_1.default.existsSync(VERSIONS_DIR)) {
        fs_1.default.mkdirSync(VERSIONS_DIR, { recursive: true });
        console.log('[init] Created migrations/versions/');
    }
    const rootFiles = fs_1.default.readdirSync(MIGRATIONS_ROOT).filter((f) => {
        return f.endsWith('.js') && /^\d+-.+\.js$/.test(f);
    });
    if (rootFiles.length > 0) {
        console.log(`[init] Found ${rootFiles.length} migration(s) in root. Moving to versions/...`);
        rootFiles.sort((a, b) => {
            const na = parseInt(a, 10);
            const nb = parseInt(b, 10);
            return na - nb;
        });
        for (const file of rootFiles) {
            const num = parseInt(file, 10);
            const newName = `${pad(num)}-${cleanName(file)}`;
            const src = path_1.default.join(MIGRATIONS_ROOT, file);
            const dest = path_1.default.join(VERSIONS_DIR, newName);
            fs_1.default.copyFileSync(src, dest);
            fs_1.default.unlinkSync(src);
            console.log(`[init] ${file} → versions/${newName}`);
        }
    }
    const snapshotFiles = ['_current.json', '_current_bak.json'];
    for (const f of snapshotFiles) {
        const src = path_1.default.join(MIGRATIONS_ROOT, f);
        if (fs_1.default.existsSync(src)) {
            const dest = path_1.default.join(VERSIONS_DIR, f);
            fs_1.default.copyFileSync(src, dest);
            fs_1.default.unlinkSync(src);
            console.log(`[init] ${f} → versions/${f}`);
        }
    }
    let conn;
    try {
        conn = (0, connection_1.createConnection)();
        await conn.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('[init] _schema_migrations table ready.');
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[init] Could not connect to DB:', msg);
        console.warn('[init] File organization done. Run "db:init" later when DB is available.');
        console.log('[init] Done! Migration files are ready.');
        return;
    }
    finally {
        if (conn)
            await conn.close();
    }
    console.log('[init] Running pending migrations...');
    await (0, runner_1.runMigrations)({ sequelize: (0, connection_1.createConnection)() });
    console.log('[init] Done! Migration system is ready.');
}
exports.default = { initMigrations };
module.exports = { initMigrations };
//# sourceMappingURL=init.js.map