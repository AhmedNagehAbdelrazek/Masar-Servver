require('dotenv').config();

const bcrypt = require('bcrypt');
const sequelize = require('./config/database');
const {
  AppSettings,
  SiteContent,
  ShippingRegion,
  Product,
  Admin,
} = require('./Models/index');

const SALT_ROUNDS = 10;
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_SUPERADMIN_USERNAME = 'superadmin';
const DEFAULT_SUPERADMIN_PASSWORD = 'superadmin123';

async function seed() {

  console.log('Seeding database...');

  await sequelize.authenticate();
  console.log('Database connected.');

  await sequelize.sync();
  console.log('Models synced.');

  // seed the models with the default values

  

  await sequelize.close();
  console.log('Seeding complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
