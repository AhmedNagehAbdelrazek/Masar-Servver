/**
 * Patches sequelize-auto-migrations for Sequelize v6+ compatibility.
 * Sequelize v6 renamed Model.attributes → Model.rawAttributes.
 * This postinstall script fixes the reference in migrate.js
 * so that `makemigration` can read model definitions correctly.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'sequelize-auto-migrations',
  'lib',
  'migrate.js'
);

if (!fs.existsSync(target)) return;

let content = fs.readFileSync(target, 'utf8');

const needle = 'let attributes = models[model].attributes;';
const replacement = 'let attributes = models[model].rawAttributes || models[model].attributes;';

if (content.includes(needle)) {
  content = content.replace(needle, replacement);
  fs.writeFileSync(target, content, 'utf8');
  console.log('[postinstall] Patched sequelize-auto-migrations for Sequelize v6 (rawAttributes).');
}
