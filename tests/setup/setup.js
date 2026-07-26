const createApp = require('../../app');
const sequelize = require('../../config/database');

let app;
let agent;

beforeAll(async () => {
  try {
    await sequelize.authenticate();
  } catch (err) {
    console.warn('Database not available, tests may fail:', err.message);
  }
  app = createApp();
  agent = require('supertest')(app);
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (err) {
    // ignore
  }
});

module.exports = {
  getApp: () => app,
  getAgent: () => agent,
};
