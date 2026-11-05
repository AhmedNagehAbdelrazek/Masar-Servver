import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args: string[] = process.argv.slice(2);
const modelsPath: string = 'Models';
const migrationsPath: string = path.join('migrations', 'versions');

// Use tsx to allow requiring TypeScript Models (Models/*.ts) via sequelize-auto-migrations.
// Direct `npx makemigration` fails with "Cannot find module '.../Models'" because it tries
// to require a TS directory without a transpiler.
const isWin = process.platform === 'win32';
const makemigrationBin = path.join('node_modules', 'sequelize-auto-migrations', 'bin', 'makemigration.js');
// Quote the bin path for Windows (contains spaces like "Masar Servver")
const binArg = isWin ? `"${makemigrationBin}"` : makemigrationBin;
const cmd: string = `npx tsx ${binArg} --models-path "${modelsPath}" --migrations-path "${migrationsPath}" ${args.join(' ')}`;

try {
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
} catch (_err: unknown) {
  process.exit(1);
}

const versionsDir: string = path.join(process.cwd(), migrationsPath);
const files: string[] = fs.readdirSync(versionsDir).filter((f: string) => /^\d+-/.test(f) && !f.startsWith('0'));
for (const file of files) {
  const num: number = parseInt(file, 10);
  const padded: string = String(num).padStart(3, '0');
  const newName: string = file.replace(/^\d+/, padded);
  fs.renameSync(path.join(versionsDir, file), path.join(versionsDir, newName));
  console.log(`Renamed: ${file} → ${newName}`);
}

export {};
