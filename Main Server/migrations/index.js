const { runMigrations } = require('./main/runner');
const { initMigrations } = require('./scripts/init');

module.exports = { runMigrations, initMigrations };
