"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const args = process.argv.slice(2);
const modelsPath = 'Models';
const migrationsPath = path_1.default.join('migrations', 'versions');
const cmd = `npx makemigration --models-path "${modelsPath}" --migrations-path "${migrationsPath}" ${args.join(' ')}`;
try {
    (0, child_process_1.execSync)(cmd, { stdio: 'inherit', cwd: process.cwd() });
}
catch (_err) {
    process.exit(1);
}
const versionsDir = path_1.default.join(process.cwd(), migrationsPath);
const files = fs_1.default.readdirSync(versionsDir).filter((f) => /^\d+-/.test(f) && !f.startsWith('0'));
for (const file of files) {
    const num = parseInt(file, 10);
    const padded = String(num).padStart(3, '0');
    const newName = file.replace(/^\d+/, padded);
    fs_1.default.renameSync(path_1.default.join(versionsDir, file), path_1.default.join(versionsDir, newName));
    console.log(`Renamed: ${file} → ${newName}`);
}
//# sourceMappingURL=generate.js.map