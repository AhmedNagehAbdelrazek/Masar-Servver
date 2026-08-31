const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const modelsPath = 'Models';
const migrationsPath = path.join('migrations', 'versions');

const cmd = `npx makemigration --models-path "${modelsPath}" --migrations-path "${migrationsPath}" ${args.join(' ')}`;

try {
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
} catch (_err) {
  process.exit(1);
}

const versionsDir = path.join(process.cwd(), migrationsPath);
const files = fs.readdirSync(versionsDir).filter((f) => /^\d+-/.test(f) && !f.startsWith('0'));
for (const file of files) {
  const num = parseInt(file, 10);
  const padded = String(num).padStart(3, '0');
  const newName = file.replace(/^\d+/, padded);
  fs.renameSync(path.join(versionsDir, file), path.join(versionsDir, newName));
  console.log(`Renamed: ${file} → ${newName}`);
}
