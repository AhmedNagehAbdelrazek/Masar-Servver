require('dotenv').config();

const bcrypt = require('bcrypt');
const sequelize = require('./config/database');
const M = require('./Models');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;
const DAY = 86400000;
const HOUR = 3600000;
const MIN = 60000;
const now = Date.now();
const at = (ms) => new Date(ms);

// ponytail: wipe + reinsert instead of upsert per row — this is a dev mock seeder, not a migration
const TABLES = [
  'audit_logs', 'notification_settings', 'notifications', 'favorite_routes', 'favorite_drivers',
  'messages', 'support_tickets', 'penalties', 'complaints', 'delay_events', 'ratings', 'request_offers',
  'ride_requests', 'bookings', 'trip_seats', 'trip_stops', 'trip_attributes', 'trips',
  'driver_subscriptions', 'subscription_transactions', 'subscription_plans', 'payment_methods',
  'vehicles', 'passenger_profiles', 'verification_status_changes', 'driver_profiles',
  'uploaded_images', 'users',
];

async function resetTables() {
  await sequelize.query(`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

// Marker user — its presence means mock data is already seeded.
const MARKER_PHONE = '+962790000001';

/**
 * Opt-in entry point for server startup: no-ops unless SEED_MOCK_ON_BOOT=true,
 * then seeds only when the marker user is absent — using the same destructive
 * reset as the CLI so pre-existing rows (e.g. the base admin seeder) can never
 * collide. ponytail: no transaction around inserts — if a first boot crashes
 * mid-seed, delete partial rows (or run `npm run seed:mock`) and reboot.
 */
async function seedMockData() {
  if (process.env.NODE_ENV === 'test') return false;
  if (process.env.SEED_MOCK_ON_BOOT !== 'true') return false;
  const marker = await M.User.findOne({ where: { phone: MARKER_PHONE }, attributes: ['id'] });
  if (marker) {
    console.log('[mock-seed] mock data already present — skipping');
    return false;
  }
  console.log('[mock-seed] SEED_MOCK_ON_BOOT=true — resetting tables and seeding mock data...');
  await resetTables();
  await runInserts();
  console.log('[mock-seed] mock data seeded.');
  return true;
}

async function runInserts() {
  const passwordHash = await bcrypt.hash('Test@1234', SALT_ROUNDS);
  const adminPasswordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@1234', SALT_ROUNDS);

  // ===== USERS =====
  const admin = await M.User.create({
    phone: process.env.SEED_ADMIN_PHONE || '+962700000099',
    fullName: 'Masar Admin',
    role: 'admin',
    gender: 'male',
    passwordHash: adminPasswordHash,
    isVerified: true,
    verificationStatus: 'approved',
    locale: 'en',
    email: 'admin@masar.app',
  });

  const moderator = await M.User.create({
    phone: '+962700000098',
    fullName: 'Content Moderator',
    role: 'moderator',
    passwordHash,
    isVerified: true,
    verificationStatus: 'approved',
    locale: 'ar',
  });

  const d1 = await M.User.create({
    phone: '+962790000001', countryCode: 'JO', fullName: 'Omar Al-Rashid', role: 'driver',
    gender: 'male', age: 34, passwordHash, isVerified: true, verificationStatus: 'approved',
    verificationSubmittedAt: at(now - 30 * DAY), avgRating: 4.7, locale: 'ar', status: 'active',
    totalBalance: 12.5, lastLoginAt: at(now - 2 * HOUR),
  });
  const d2 = await M.User.create({
    phone: '+962790000002', countryCode: 'JO', fullName: 'Ahmad Suleiman', role: 'driver',
    gender: 'male', age: 41, passwordHash, isVerified: true, verificationStatus: 'approved',
    verificationSubmittedAt: at(now - 25 * DAY), avgRating: 4.5, locale: 'ar', status: 'active',
    totalBalance: 3, lastLoginAt: at(now - 1 * DAY),
  });
  const d3 = await M.User.create({
    phone: '+962790000003', countryCode: 'JO', fullName: 'Khaled Nasser', role: 'driver',
    gender: 'male', age: 27, passwordHash, isVerified: false, verificationStatus: 'pending',
    verificationSubmittedAt: at(now - 1 * DAY), avgRating: 0, locale: 'ar', status: 'active',
  });
  const d4 = await M.User.create({
    phone: '+962790000004', countryCode: 'JO', fullName: 'Sami Haddad', role: 'driver',
    gender: 'male', age: 38, passwordHash, isVerified: true, verificationStatus: 'approved',
    avgRating: 3.9, locale: 'ar', status: 'suspended', strikes: 3,
    totalBalance: -4.5, isInDebt: true,
  });
  const d5 = await M.User.create({
    phone: '+962790000005', countryCode: 'JO', fullName: 'Lina Qasem', role: 'driver',
    gender: 'female', age: 29, passwordHash, isVerified: true, verificationStatus: 'approved',
    verificationSubmittedAt: at(now - 200 * DAY), avgRating: 4.9, locale: 'ar', status: 'active',
    totalBalance: 8,
  });

  const p1 = await M.User.create({
    phone: '+962780000001', countryCode: 'JO', fullName: 'Rana Obeidat', role: 'passenger',
    gender: 'female', age: 24, passwordHash, isVerified: true, verificationStatus: 'approved',
    avgRating: 4.8, locale: 'ar', status: 'active', lastLoginAt: at(now - 30 * MIN),
  });
  const p2 = await M.User.create({
    phone: '+962780000002', countryCode: 'JO', fullName: 'Fadi Zuabi', role: 'passenger',
    gender: 'male', age: 31, passwordHash, isVerified: true, verificationStatus: 'approved',
    avgRating: 4.4, locale: 'ar', status: 'active',
  });
  const p3 = await M.User.create({
    phone: '+962780000003', countryCode: 'JO', fullName: 'Huda Ammari', role: 'passenger',
    gender: 'female', age: 26, passwordHash, isVerified: true, verificationStatus: 'approved',
    avgRating: 5.0, locale: 'ar', status: 'active',
  });
  const p4 = await M.User.create({
    phone: '+962780000004', countryCode: 'JO', fullName: 'Tariq Nawaf', role: 'passenger',
    gender: 'male', age: 45, passwordHash, isVerified: true, verificationStatus: 'approved',
    avgRating: 4.0, locale: 'en', status: 'warned', strikes: 1,
  });
  const p5 = await M.User.create({
    phone: '+962780000005', countryCode: 'JO', fullName: 'Nour Salameh', role: 'passenger',
    gender: 'female', age: 22, passwordHash, isVerified: true, verificationStatus: 'approved',
    avgRating: 4.6, locale: 'ar', status: 'active',
  });
  console.log(`[mock-seed] users: ${await M.User.count()}`);

  // ===== UPLOADED IMAGES =====
  const mkImage = async (n) =>
    (
      await M.UploadedImage.create({
        hash: `mockhash${String(n).padStart(4, '0')}`,
        url: `https://res.cloudinary.com/demo/image/uploads/mock_${n}.jpg`,
        filename: `mock_${n}.jpg`,
        mimetype: 'image/jpeg',
        size: 240000 + n * 1000,
        provider: 'cloudinary',
      })
    ).id;
  const imgIds = [];
  for (let i = 1; i <= 14; i++) imgIds.push(await mkImage(i));
  console.log(`[mock-seed] uploaded_images: ${await M.UploadedImage.count()}`);

  // ===== DRIVER PROFILES =====
  await M.DriverProfile.bulkCreate([
    { driverId: d1.id, userIdentificationFront: imgIds[0], userIdentificationBack: imgIds[1], linceseFront: imgIds[2], linceseBack: imgIds[3], personalImageWithId: imgIds[4], nationalID: '9871234567', idVerified: true, licenseNumber: 'JO-L-88123', licenseExpiry: '2028-05-01', subscriptionTier: 'pro_monthly', subscriptionExpiresAt: at(now + 20 * DAY), totalTrips: 132, totalEarnings: 1450.75, responseRate: 97.5, bio: 'Amman-based driver, 10 years on the Amman–Irbid route.' },
    { driverId: d2.id, userIdentificationFront: imgIds[5], userIdentificationBack: imgIds[6], linceseFront: imgIds[7], linceseBack: imgIds[8], personalImageWithId: imgIds[9], nationalID: '9876543210', idVerified: true, licenseNumber: 'JO-L-77210', licenseExpiry: '2027-11-15', subscriptionTier: 'free', totalTrips: 64, totalEarnings: 512.25, responseRate: 88.0, bio: 'Zarqa–Amman daily commuter.' },
    { driverId: d3.id, userIdentificationFront: imgIds[10], userIdentificationBack: imgIds[11], linceseFront: imgIds[12], linceseBack: imgIds[13], personalImageWithId: imgIds[0], nationalID: '9911223344', idVerified: false, licenseNumber: 'JO-L-90112', licenseExpiry: '2029-02-01', subscriptionTier: 'free', totalTrips: 0, totalEarnings: 0 },
    { driverId: d4.id, userIdentificationFront: imgIds[1], userIdentificationBack: imgIds[2], linceseFront: imgIds[3], linceseBack: imgIds[4], personalImageWithId: imgIds[5], nationalID: '9566778899', idVerified: true, licenseNumber: 'JO-L-55331', licenseExpiry: '2026-12-31', subscriptionTier: 'free', totalTrips: 87, totalEarnings: 690.0, responseRate: 61.0 },
    { driverId: d5.id, userIdentificationFront: imgIds[6], userIdentificationBack: imgIds[7], linceseFront: imgIds[8], linceseBack: imgIds[9], personalImageWithId: imgIds[10], nationalID: '9445566778', idVerified: true, licenseNumber: 'JO-L-66778', licenseExpiry: '2030-01-20', subscriptionTier: 'pro_annual', subscriptionExpiresAt: at(now + 5 * DAY), totalTrips: 210, totalEarnings: 2310.4, responseRate: 99.0, bio: 'Women-only trips available.' },
  ]);
  console.log(`[mock-seed] driver_profiles: ${await M.DriverProfile.count()}`);

  // ===== PASSENGER PROFILES =====
  await M.PassengerProfile.bulkCreate([
    { passengerId: p1.id, preferredGender: 'female', smokingPreference: 'non_smoking', savedRoutes: [{ origin: 'Amman', destination: 'Irbid', label: 'Home weekends' }], emergencyContacts: [{ name: 'Mother', phone: '+962791111111' }] },
    { passengerId: p2.id, preferredGender: 'any', smokingPreference: 'no_preference', savedRoutes: [{ origin: 'Amman', destination: 'Aqaba' }], emergencyContacts: [] },
    { passengerId: p3.id, preferredGender: 'any', smokingPreference: 'non_smoking', savedRoutes: [], emergencyContacts: [{ name: 'Husband', phone: '+962792222222' }] },
    { passengerId: p4.id, preferredGender: 'male', smokingPreference: 'smoking_allowed', savedRoutes: [{ origin: 'Zarqa', destination: 'Amman', label: 'Work' }], emergencyContacts: [] },
    { passengerId: p5.id, preferredGender: 'female', smokingPreference: 'non_smoking', savedRoutes: [], emergencyContacts: [{ name: 'Sister', phone: '+962793333333' }] },
  ]);
  console.log(`[mock-seed] passenger_profiles: ${await M.PassengerProfile.count()}`);

  // ===== VEHICLES =====
  const v1 = await M.Vehicle.create({ driverId: d1.id, manufacturer: 'Toyota', model: 'Camry', vehicleType: 'sedan', modelYear: 2021, plateNumber: '12-3456', codeNumber: 'AB C', color: 'White', seats: 5, registrationDocFront: imgIds[2], registrationDocBack: imgIds[3], vehiclePhotoFront: imgIds[4], vehiclePhotoBack: imgIds[5], isVerified: true, verifiedBy: admin.id, verifiedAt: at(now - 29 * DAY) });
  const v2 = await M.Vehicle.create({ driverId: d2.id, manufacturer: 'Hyundai', model: 'Tucson', vehicleType: 'suv', modelYear: 2019, plateNumber: '23-4567', codeNumber: 'CD E', color: 'Silver', seats: 5, registrationDocFront: imgIds[6], registrationDocBack: imgIds[7], vehiclePhotoFront: imgIds[8], vehiclePhotoBack: imgIds[9], isVerified: true, verifiedBy: admin.id, verifiedAt: at(now - 24 * DAY) });
  await M.Vehicle.create({ driverId: d3.id, manufacturer: 'Kia', model: 'Cerato', vehicleType: 'sedan', modelYear: 2020, plateNumber: '34-5678', codeNumber: 'EF G', color: 'Gray', seats: 4, registrationDocFront: imgIds[12], registrationDocBack: imgIds[13], isVerified: false });
  await M.Vehicle.create({ driverId: d4.id, manufacturer: 'Nissan', model: 'Sunny', vehicleType: 'sedan', modelYear: 2018, plateNumber: '45-6789', codeNumber: 'GH I', color: 'Blue', seats: 4, registrationDocFront: imgIds[3], registrationDocBack: imgIds[4], vehiclePhotoFront: imgIds[5], vehiclePhotoBack: imgIds[6], isVerified: true, verifiedBy: admin.id, verifiedAt: at(now - 60 * DAY) });
  const v5 = await M.Vehicle.create({ driverId: d5.id, manufacturer: 'Toyota', model: 'Corolla', vehicleType: 'sedan', modelYear: 2022, plateNumber: '56-7890', codeNumber: 'IJ K', color: 'Black', seats: 4, registrationDocFront: imgIds[8], registrationDocBack: imgIds[9], vehiclePhotoFront: imgIds[10], vehiclePhotoBack: imgIds[11], isVerified: true, verifiedBy: admin.id, verifiedAt: at(now - 199 * DAY) });
  console.log(`[mock-seed] vehicles: ${await M.Vehicle.count()}`);

  // ===== VERIFICATION STATUS CHANGES =====
  await M.VerificationStatusChange.bulkCreate([
    { driverId: d1.id, fromStatus: 'unverified', toStatus: 'pending', changedBy: d1.id },
    { driverId: d1.id, fromStatus: 'pending', toStatus: 'approved', reason: 'All documents valid', changedBy: admin.id },
    { driverId: d2.id, fromStatus: 'pending', toStatus: 'approved', reason: 'Docs clear', changedBy: admin.id },
    { driverId: d3.id, fromStatus: 'unverified', toStatus: 'pending', changedBy: d3.id },
    { driverId: d4.id, fromStatus: 'pending', toStatus: 'approved', reason: 'Approved after resubmission', markedFields: ['vehicle_photo'], changedBy: admin.id },
    { driverId: d5.id, fromStatus: 'pending', toStatus: 'approved', reason: 'Approved', changedBy: admin.id },
  ]);
  console.log(`[mock-seed] verification_status_changes: ${await M.VerificationStatusChange.count()}`);

  // ===== SUBSCRIPTION PLANS =====
  const planFree = await M.SubscriptionPlan.create({ name: 'Free Tier', periodDays: 30, percentageCut: 15, cost: 0, status: null, features: ['Post trips', '5 free completed trips/month'], isFree: true, freeOffer: { type: 'trips', value: 5 }, isActive: true });
  const planWeekly = await M.SubscriptionPlan.create({ name: 'Pro Weekly', periodDays: 7, percentageCut: 10, cost: 3, status: 'frequent', features: ['Lower commission', 'Priority support'], isFree: false, isActive: true });
  const planMonthly = await M.SubscriptionPlan.create({ name: 'Pro Monthly', periodDays: 30, percentageCut: 8, cost: 16, status: 'popular', features: ['Lowest monthly commission', 'Featured trips', 'Priority support'], isFree: false, isActive: true });
  const planAnnual = await M.SubscriptionPlan.create({ name: 'Pro Annual', periodDays: 365, percentageCut: 5, cost: 150, status: 'most_requested', features: ['Best commission rate', 'All Pro features', 'Badge'], isFree: false, isActive: true });
  await M.SubscriptionPlan.create({ name: 'Legacy Basic', periodDays: 30, percentageCut: 12, cost: 8, features: ['Legacy plan'], isFree: false, isActive: false });
  console.log(`[mock-seed] subscription_plans: ${await M.SubscriptionPlan.count()}`);

  // ===== PAYMENT METHODS =====
  await M.PaymentMethod.bulkCreate([
    { name: 'CliQ', accountNumber: 'MASARJO', type: 'e-wallet', email: 'pay@masar.app', isActive: true },
    { name: 'Zain Cash', accountNumber: '0790000001', type: 'mobile_money', isActive: true },
    { name: 'Orange Money', accountNumber: '0770000001', type: 'mobile_money', isActive: true },
    { name: 'Arab Bank Transfer', accountNumber: 'JO94ARAB000000000001234567', type: 'bank_account', email: 'finance@masar.app', isActive: true },
    { name: 'PayPal (legacy)', accountNumber: 'paypal@masar.app', type: 'e-wallet', email: 'paypal@masar.app', isActive: false },
  ]);
  console.log(`[mock-seed] payment_methods: ${await M.PaymentMethod.count()}`);

  // ===== DRIVER SUBSCRIPTIONS =====
  const cliqSnap = { name: 'CliQ', account_number: '0791111111', type: 'e-wallet' };
  const zainSnap = { name: 'Zain Cash', account_number: '0792222222', type: 'mobile_money' };
  const bankSnap = { name: 'Arab Bank Transfer', account_number: 'JO94ARAB...', type: 'bank_account' };
  const s1 = await M.DriverSubscription.create({ driverId: d1.id, planId: planMonthly.id, planName: 'Pro Monthly', planPeriodDays: 30, planPercentageCut: 8, planCost: 16, balance: 0, screenshotId: imgIds[0], paymentMethod: cliqSnap, status: 'active', approvedAt: at(now - 10 * DAY), activatedAt: at(now - 10 * DAY), expiresAt: at(now + 20 * DAY) });
  await M.DriverSubscription.create({ driverId: d1.id, planId: planMonthly.id, planName: 'Pro Monthly', planPeriodDays: 30, planPercentageCut: 8, planCost: 16, balance: 0, screenshotId: imgIds[1], paymentMethod: cliqSnap, status: 'expired', approvedAt: at(now - 40 * DAY), activatedAt: at(now - 40 * DAY), expiresAt: at(now - 10 * DAY) });
  await M.DriverSubscription.create({ driverId: d2.id, planId: planFree.id, planName: 'Free Tier', planPeriodDays: 30, planPercentageCut: 15, planCost: 0, balance: 0, paymentMethod: { name: 'None', type: 'bank_account', account_number: '-' }, freeOffer: { type: 'trips', value: 5 }, freeTripsUsed: 2, status: 'active', approvedAt: at(now - 15 * DAY), activatedAt: at(now - 15 * DAY), expiresAt: at(now + 15 * DAY) });
  await M.DriverSubscription.create({ driverId: d3.id, planId: planMonthly.id, planName: 'Pro Monthly', planPeriodDays: 30, planPercentageCut: 8, planCost: 16, balance: 16, screenshotId: imgIds[13], paymentMethod: cliqSnap, status: 'pending_approval', adminNotes: null });
  await M.DriverSubscription.create({ driverId: d4.id, planId: planMonthly.id, planName: 'Pro Monthly', planPeriodDays: 30, planPercentageCut: 8, planCost: 16, balance: 0, screenshotId: imgIds[2], paymentMethod: bankSnap, status: 'expired', approvedAt: at(now - 60 * DAY), activatedAt: at(now - 60 * DAY), expiresAt: at(now - 30 * DAY) });
  await M.DriverSubscription.create({ driverId: d5.id, planId: planAnnual.id, planName: 'Pro Annual', planPeriodDays: 365, planPercentageCut: 5, planCost: 150, balance: 0, screenshotId: imgIds[8], paymentMethod: bankSnap, status: 'active', approvedAt: at(now - 360 * DAY), activatedAt: at(now - 360 * DAY), expiresAt: at(now + 5 * DAY) });
  await M.DriverSubscription.create({ driverId: d5.id, planId: planWeekly.id, planName: 'Pro Weekly', planPeriodDays: 7, planPercentageCut: 10, planCost: 3, balance: 3, screenshotId: imgIds[9], paymentMethod: zainSnap, status: 'rejected', adminNotes: 'Screenshot unclear — transfer amount not visible.' });
  console.log(`[mock-seed] driver_subscriptions: ${await M.DriverSubscription.count()}`);

  // ===== SUBSCRIPTION TRANSACTIONS =====
  await M.SubscriptionTransaction.bulkCreate([
    { driverId: d1.id, tier: 'pro_monthly', amount: 16, currency: 'JOD', paymentMethod: 'cliq', status: 'completed', providerTransactionId: 'CLIQ-TX-10001', expiresAt: at(now + 20 * DAY) },
    { driverId: d1.id, tier: 'pro_monthly', amount: 16, currency: 'JOD', paymentMethod: 'cliq', status: 'completed', providerTransactionId: 'CLIQ-TX-09951', expiresAt: at(now - 10 * DAY) },
    { driverId: d3.id, tier: 'pro_monthly', amount: 16, currency: 'JOD', paymentMethod: 'cliq', status: 'pending', providerTransactionId: 'CLIQ-TX-10112', expiresAt: at(now + 30 * DAY) },
    { driverId: d4.id, tier: 'pro_monthly', amount: 16, currency: 'JOD', paymentMethod: 'bank_transfer', status: 'completed', providerTransactionId: 'BANK-TX-08820', expiresAt: at(now - 30 * DAY) },
    { driverId: d5.id, tier: 'pro_annual', amount: 150, currency: 'JOD', paymentMethod: 'bank_transfer', status: 'completed', providerTransactionId: 'BANK-TX-A0011', expiresAt: at(now + 5 * DAY) },
  ]);
  console.log(`[mock-seed] subscription_transactions: ${await M.SubscriptionTransaction.count()}`);

  // ===== TRIPS =====
  const t1 = await M.Trip.create({ driverId: d1.id, vehicleId: v1.id, originCity: 'Amman', originArea: 'Abdali', originAddress: 'Abdali Bus Terminal', originLat: 31.95860000, originLng: 35.91350000, destinationCity: 'Irbid', destinationArea: 'University Street', destinationAddress: 'Yarmouk University Main Gate', destinationLat: 32.53950000, destinationLng: 35.85980000, departureTime: at(now - 3 * DAY), arrivalTime: at(now - 3 * DAY + 105 * MIN), totalSeats: 4, availableSeats: 1, farePerSeat: 7, currency: 'JOD', genderPreference: 'all', driverInstructions: ['Be at pickup 10 min early', 'No smoking'], status: 'completed' });
  const t2 = await M.Trip.create({ driverId: d1.id, vehicleId: v1.id, originCity: 'Amman', originArea: '7th Circle', originAddress: '7th Circle Bus Stop', originLat: 31.93520000, originLng: 35.87790000, destinationCity: 'Aqaba', destinationArea: 'City Center', destinationAddress: 'Aqaba Marine Park Road', destinationLat: 29.53210000, destinationLng: 35.00630000, departureTime: at(now - 45 * MIN), arrivalTime: at(now + 3 * HOUR + 30 * MIN), totalSeats: 4, availableSeats: 2, farePerSeat: 18, currency: 'JOD', genderPreference: 'all', driverInstructions: ['Long ride — one rest stop'], status: 'in_progress' });
  const t3 = await M.Trip.create({ driverId: d1.id, vehicleId: v1.id, originCity: 'Amman', originArea: 'Shmeisani', originAddress: 'Shmeisani Market', originLat: 31.97010000, originLng: 35.89050000, destinationCity: 'Dead Sea', destinationArea: 'Amman Beach', destinationAddress: 'Amman Beach Resort', destinationLat: 31.58740000, destinationLng: 35.55690000, departureTime: at(now + 30 * MIN), arrivalTime: at(now + 90 * MIN), totalSeats: 4, availableSeats: 3, farePerSeat: 5, currency: 'JOD', genderPreference: 'all', driverInstructions: ['Swim gear welcome'], status: 'published' });
  const t4 = await M.Trip.create({ driverId: d1.id, vehicleId: v1.id, originCity: 'Amman', originArea: 'Sweileh', originAddress: 'Sweileh Circle', originLat: 32.00730000, originLng: 35.84280000, destinationCity: 'Jerash', destinationArea: 'Visitor Center', destinationAddress: 'Jerash Archaeological Site', destinationLat: 32.28080000, destinationLng: 35.89900000, departureTime: at(now + 2 * DAY), arrivalTime: at(now + 2 * DAY + 75 * MIN), totalSeats: 4, availableSeats: 0, farePerSeat: 6, currency: 'JOD', genderPreference: 'all', status: 'full' });
  const t5 = await M.Trip.create({ driverId: d5.id, vehicleId: v5.id, originCity: 'Amman', originArea: 'Wakalat St', originAddress: 'Wakalat Street', destinationCity: 'Salt', destinationArea: 'Old Town', destinationAddress: 'Salt Old Souk', departureTime: at(now + 1 * DAY), arrivalTime: at(now + 1 * DAY + 60 * MIN), totalSeats: 3, availableSeats: 3, farePerSeat: 4, currency: 'JOD', genderPreference: 'women_only', driverInstructions: ['Women only trip'], status: 'cancelled' });
  const t6 = await M.Trip.create({ driverId: d2.id, vehicleId: v2.id, originCity: 'Zarqa', originArea: 'Downtown', originAddress: 'Zarqa Central Bus', destinationCity: 'Amman', destinationArea: 'Mahes', destinationAddress: 'Mahes District', departureTime: at(now + 1 * DAY + 6 * HOUR), arrivalTime: at(now + 1 * DAY + 7 * HOUR + 20 * MIN), totalSeats: 5, availableSeats: 3, farePerSeat: 4, currency: 'JOD', isRecurring: true, recurrencePattern: { type: 'weekly' }, recurrenceDays: [0, 4], recurrenceEndDate: at(now + 60 * DAY), genderPreference: 'all', status: 'published' });
  console.log(`[mock-seed] trips: ${await M.Trip.count()}`);

  // ===== TRIP SEATS =====
  const seatRows = [];
  const addSeats = (trip, booked = []) => {
    for (let n = 1; n <= trip.totalSeats; n++) {
      seatRows.push({ tripId: trip.id, seatNumber: n, seatType: n === 1 ? 'driver' : booked.includes(n) ? 'unavailable' : 'available' });
    }
  };
  addSeats(t1, [2, 3]);
  addSeats(t2, [2]);
  addSeats(t3);
  addSeats(t4, [2, 3, 4]);
  addSeats(t5);
  addSeats(t6, [2]);
  await M.TripSeat.bulkCreate(seatRows);
  console.log(`[mock-seed] trip_seats: ${await M.TripSeat.count()}`);

  // ===== TRIP STOPS =====
  await M.TripStop.bulkCreate([
    { tripId: t1.id, stopOrder: 1, stopName: 'North Amman Garage', city: 'Amman', address: 'Sahafah St', lat: 31.9634, lng: 35.9289, stopType: 'pickup', estimatedArrival: at(now - 3 * DAY + 10 * MIN) },
    { tripId: t1.id, stopOrder: 2, stopName: 'University of Jordan', city: 'Amman', address: 'Main Gate', lat: 32.0103, lng: 35.8745, stopType: 'dropoff', estimatedArrival: at(now - 3 * DAY + 40 * MIN) },
    { tripId: t2.id, stopOrder: 1, stopName: 'Madaba Junction', city: 'Madaba', lat: 31.7160, lng: 35.7938, stopType: 'both', estimatedArrival: at(now + 50 * MIN) },
    { tripId: t2.id, stopOrder: 2, stopName: 'Petra Street Rest Stop', city: 'Karak', lat: 31.1850, lng: 35.7040, stopType: 'both', estimatedArrival: at(now + 110 * MIN) },
    { tripId: t3.id, stopOrder: 1, stopName: 'Naour', city: 'Amman', lat: 31.9480, lng: 35.8180, stopType: 'pickup', estimatedArrival: at(now + 40 * MIN) },
    { tripId: t4.id, stopOrder: 1, stopName: 'Souf Junction', city: 'Jerash', lat: 32.2700, lng: 35.8930, stopType: 'dropoff', estimatedArrival: at(now + 2 * DAY + 55 * MIN) },
  ]);
  console.log(`[mock-seed] trip_stops: ${await M.TripStop.count()}`);

  // ===== TRIP ATTRIBUTES =====
  await M.TripAttribute.bulkCreate([
    { tripId: t1.id, attrKey: 'music', attrValue: 'allowed' },
    { tripId: t1.id, attrKey: 'pets', attrValue: 'not_allowed' },
    { tripId: t2.id, attrKey: 'ac', attrValue: 'yes' },
    { tripId: t2.id, attrKey: 'luggage', attrValue: 'large' },
    { tripId: t3.id, attrKey: 'quiet_ride', attrValue: 'yes' },
    { tripId: t4.id, attrKey: 'food', attrValue: 'allowed' },
    { tripId: t6.id, attrKey: 'smoking', attrValue: 'no' },
    { tripId: t6.id, attrKey: 'luggage', attrValue: 'medium' },
  ]);
  console.log(`[mock-seed] trip_attributes: ${await M.TripAttribute.count()}`);

  // ===== BOOKINGS =====
  const b1 = await M.Booking.create({ tripId: t1.id, passengerId: p1.id, seatNumber: 2, seatsBooked: 1, agreedFare: 7, currency: 'JOD', dropoffPlace: 'University of Jordan', dropoffOrder: 1, status: 'completed', referenceCode: 'MS000001A', paymentStatus: 'paid_cash' });
  const b2 = await M.Booking.create({ tripId: t1.id, passengerId: p2.id, seatNumber: 3, seatsBooked: 1, agreedFare: 7, currency: 'JOD', dropoffPlace: 'Irbid Downtown', dropoffOrder: 2, status: 'confirmed', referenceCode: 'MS000002B', paymentStatus: 'pending' });
  const b3 = await M.Booking.create({ tripId: t2.id, passengerId: p2.id, seatNumber: 2, seatsBooked: 1, agreedFare: 18, currency: 'JOD', status: 'confirmed', referenceCode: 'MS000003C', paymentStatus: 'paid_cash' });
  const b4 = await M.Booking.create({ tripId: t4.id, passengerId: p1.id, seatNumber: 2, seatsBooked: 1, agreedFare: 6, currency: 'JOD', dropoffPlace: 'Jerash Visitor Center', dropoffOrder: 1, status: 'confirmed', referenceCode: 'MS000004D', paymentStatus: 'pending' });
  await M.Booking.create({ tripId: t4.id, passengerId: p3.id, seatNumber: 3, seatsBooked: 1, agreedFare: 6, currency: 'JOD', dropoffOrder: 2, status: 'confirmed', referenceCode: 'MS000005E', paymentStatus: 'pending' });
  const b6 = await M.Booking.create({ tripId: t4.id, passengerId: p4.id, seatNumber: 4, seatsBooked: 1, agreedFare: 6, currency: 'JOD', dropoffOrder: 3, status: 'pending', referenceCode: 'MS000006F', paymentStatus: 'pending' });
  await M.Booking.create({ tripId: t5.id, passengerId: p5.id, seatNumber: 2, seatsBooked: 1, agreedFare: 4, currency: 'JOD', status: 'cancelled', referenceCode: 'MS000007G', cancellationReason: 'Change of plans', cancelledBy: p5.id, cancelledAt: at(now - 6 * HOUR), paymentStatus: 'pending' });
  const b8 = await M.Booking.create({ tripId: t6.id, passengerId: p3.id, seatNumber: 2, seatsBooked: 1, agreedFare: 4, currency: 'JOD', status: 'confirmed', referenceCode: 'MS000008H', paymentStatus: 'pending' });
  console.log(`[mock-seed] bookings: ${await M.Booking.count()}`);

  // ===== RATINGS =====
  await M.Rating.bulkCreate([
    { bookingId: b1.id, raterId: p1.id, rateeId: d1.id, stars: 5, review: 'Great driver, clean car, on time.', tags: ['friendly', 'safe_driver', 'clean_car'] },
    { bookingId: b1.id, raterId: d1.id, rateeId: p1.id, stars: 5, review: 'Punctual and polite.' },
    { bookingId: b2.id, raterId: p2.id, rateeId: d1.id, stars: 4, wasLate: true, lateMinutes: 10, review: 'Good ride but left 10 minutes late.' },
    { bookingId: b2.id, raterId: d1.id, rateeId: p2.id, stars: 5 },
    { bookingId: b8.id, raterId: p3.id, rateeId: d2.id, stars: 5, review: 'Smooth commute, would book again.', tags: ['safe_driver'] },
  ]);
  console.log(`[mock-seed] ratings: ${await M.Rating.count()}`);

  // ===== DELAY EVENTS =====
  await M.DelayEvent.bulkCreate([
    { bookingId: b1.id, party: 'driver', delayMinutes: 15, reason: 'Traffic on Airport Road', reportedBy: d1.id },
    { bookingId: b1.id, party: 'passenger', delayMinutes: 10, reason: 'Could not find the meeting point', reportedBy: p1.id },
    { bookingId: b2.id, party: 'passenger', delayMinutes: 5, reportedBy: p2.id },
    { bookingId: b3.id, party: 'driver', delayMinutes: 8, reason: 'Fuel stop', reportedBy: d1.id },
    { bookingId: b8.id, party: 'driver', delayMinutes: 12, reason: 'Heavy fog on Zarqa highway', reportedBy: d2.id },
  ]);
  console.log(`[mock-seed] delay_events: ${await M.DelayEvent.count()}`);

  // ===== COMPLAINTS =====
  const c1 = await M.Complaint.create({ reporterId: p5.id, accusedId: d5.id, category: 'cancellation_dispute', description: 'Driver cancelled two hours before departure with no explanation.', evidenceUrls: ['https://res.cloudinary.com/demo/image/uploads/evidence_1.jpg'], status: 'resolved', resolution: 'Reviewed chat logs; driver had a valid emergency. Warning issued.', resolvedBy: admin.id, resolvedAt: at(now - 4 * HOUR) });
  const c2 = await M.Complaint.create({ bookingId: b6.id, reporterId: p3.id, accusedId: d4.id, category: 'misconduct', description: 'Smoked in the car despite the no-smoking attribute.', status: 'resolved', resolution: 'Confirmed by both passengers. Driver suspended for 7 days.', resolvedBy: admin.id, resolvedAt: at(now - 1 * DAY) });
  const c3 = await M.Complaint.create({ reporterId: p2.id, accusedId: p4.id, category: 'noise', description: 'Passenger was loud and on phone calls the whole ride.', status: 'reviewing' });
  const c4 = await M.Complaint.create({ reporterId: p1.id, accusedId: d1.id, category: 'route_deviation', description: 'Took a longer route without asking.', status: 'open' });
  const c5 = await M.Complaint.create({ bookingId: b6.id, reporterId: d1.id, accusedId: p4.id, category: 'no_show', description: 'Passenger never showed up at pickup and did not cancel.', status: 'open' });
  console.log(`[mock-seed] complaints: ${await M.Complaint.count()}`);

  // ===== PENALTIES =====
  // returning:false — DB lacks the model-declared `details` col; RETURNING * would fail
  await M.Penalty.bulkCreate([
    { userId: d4.id, complaintId: c2.id, type: 'suspension', penaltyType: 'misconduct', severity: 'major', reason: 'Smoking on board after repeated warnings', startsAt: at(now - 1 * DAY), endsAt: at(now + 6 * DAY), issuedBy: admin.id },
    { userId: d4.id, complaintId: c2.id, type: 'warning', penaltyType: 'general', severity: 'minor', reason: 'First misconduct report', startsAt: at(now - 20 * DAY), issuedBy: moderator.id },
    { userId: p4.id, complaintId: c5.id, type: 'warning', penaltyType: 'no_show', severity: 'minor', reason: 'No-show at pickup', startsAt: at(now - 12 * HOUR), issuedBy: admin.id },
    { userId: p2.id, complaintId: c3.id, type: 'warning', penaltyType: 'general', severity: 'minor', reason: 'Noise complaint under review', startsAt: at(now - 2 * DAY), issuedBy: moderator.id },
    { userId: d1.id, complaintId: c4.id, type: 'warning', penaltyType: 'trip_cancellation', severity: 'moderate', reason: 'Unapproved route deviation — under investigation', startsAt: at(now - 3 * HOUR), issuedBy: admin.id },
  ], { returning: false });
  console.log(`[mock-seed] penalties: ${await M.Penalty.count()}`);

  // ===== SUPPORT TICKETS =====
  // captured so chat messages below can reference ticket ids
  const tickets = await M.SupportTicket.bulkCreate([
    { userId: p1.id, category: 'billing', subject: 'Charged twice for the same seat?', description: 'My friend also booked and we see two pending amounts in the app history.', priority: 'medium', status: 'open' },
    { userId: d1.id, category: 'payout', subject: 'Commission deducted incorrectly', description: 'Trip MS000001A shows an 8% cut but my plan says 8% of fare — numbers do not match.', priority: 'high', status: 'in_progress', assignedTo: admin.id },
    { userId: p3.id, category: 'app_issue', subject: 'Map freezes on search screen', description: 'Android 14, map tiles stop loading after second search.', priority: 'low', status: 'open' },
    { userId: d5.id, category: 'subscription', subject: 'Annual plan expiring soon', description: 'Can I renew early and keep my badge?', priority: 'urgent', status: 'in_progress', assignedTo: admin.id },
    { userId: p2.id, category: 'general', subject: 'How do referral codes work?', description: 'Just want to understand the referral program.', priority: 'low', status: 'resolved', assignedTo: moderator.id, resolutionNotes: 'Explained program rules via in-app message.' },
  ]);
  console.log(`[mock-seed] support_tickets: ${await M.SupportTicket.count()}`);

  // ===== CHAT MESSAGES =====
  // Booking chats: b1 (trip t1 completed — read-only history), b3 (t2 in_progress — live),
  // b4 (t4 full, upcoming), b8 (t6 published, upcoming). Support chats mirror the tickets above.
  await M.Message.bulkCreate([
    // b1: p1 <-> d1 on Amman -> Irbid (completed) — everything read
    { bookingId: b1.id, senderId: d1.id, receiverId: p1.id, message: 'Hi Rana! Pickup is Abdali Bus Terminal at 4 PM. Look for the white Camry.', isRead: true, readAt: at(now - 3 * DAY - 115 * MIN), createdat: at(now - 3 * DAY - 2 * HOUR) },
    { bookingId: b1.id, senderId: p1.id, receiverId: d1.id, message: 'Great, see you there. I will have one small backpack.', isRead: true, readAt: at(now - 3 * DAY - 100 * MIN), createdat: at(now - 3 * DAY - 110 * MIN) },
    { bookingId: b1.id, senderId: d1.id, receiverId: p1.id, message: 'No problem. I am 5 minutes away.', isRead: true, readAt: at(now - 3 * DAY + 30 * MIN), createdat: at(now - 3 * DAY - 20 * MIN) },
    { bookingId: b1.id, senderId: p1.id, receiverId: d1.id, message: 'Thanks for the ride! I left my charger on the back seat.', isRead: true, readAt: at(now - 3 * DAY + 95 * MIN), createdat: at(now - 3 * DAY + 80 * MIN) },
    { bookingId: b1.id, senderId: d1.id, receiverId: p1.id, message: 'Found it. You can grab it next trip, just message me beforehand.', isRead: true, readAt: at(now - 3 * DAY + 110 * MIN), createdat: at(now - 3 * DAY + 95 * MIN) },

    // b3: p2 <-> d1 on Amman -> Aqaba (in progress) — latest driver messages unread
    { bookingId: b3.id, senderId: p2.id, receiverId: d1.id, message: 'Good morning! Which side of 7th Circle should I wait at?', isRead: true, readAt: at(now - 39 * MIN), createdat: at(now - 40 * MIN) },
    { bookingId: b3.id, senderId: d1.id, receiverId: p2.id, message: 'The gas station side. I will send my location when I get close.', isRead: true, readAt: at(now - 37 * MIN), createdat: at(now - 38 * MIN) },
    { bookingId: b3.id, senderId: p2.id, receiverId: d1.id, message: 'Perfect, thank you.', isRead: true, readAt: at(now - 36 * MIN), createdat: at(now - 37 * MIN) },
    { bookingId: b3.id, senderId: d1.id, receiverId: p2.id, message: 'On my way, about 10 minutes out.', createdat: at(now - 12 * MIN) },
    { bookingId: b3.id, senderId: d1.id, receiverId: p2.id, message: 'Traffic at the roundabout, might be 15 minutes late.', createdat: at(now - 5 * MIN) },

    // b4: p1 <-> d1 on Amman -> Jerash (full, departs in 2 days)
    { bookingId: b4.id, senderId: p1.id, receiverId: d1.id, message: 'Hi Omar, can we use Souf Junction as my dropoff instead of the visitor center?', isRead: true, readAt: at(now - 25 * HOUR), createdat: at(now - 26 * HOUR) },
    { bookingId: b4.id, senderId: d1.id, receiverId: p1.id, message: 'Sure, Souf Junction works fine. It is already one of the trip stops.', isRead: true, readAt: at(now - 24 * HOUR), createdat: at(now - 25 * HOUR) },
    { bookingId: b4.id, senderId: p1.id, receiverId: d1.id, messageType: 'image', message: 'https://res.cloudinary.com/demo/image/uploads/mock_7.jpg', isRead: true, readAt: at(now - 23 * HOUR), createdat: at(now - 24 * HOUR + 5 * MIN) },
    { bookingId: b4.id, senderId: p1.id, receiverId: d1.id, message: 'This is the meeting point I mean, next to the circle.', isRead: true, readAt: at(now - 23 * HOUR), createdat: at(now - 24 * HOUR + 6 * MIN) },
    { bookingId: b4.id, senderId: d1.id, receiverId: p1.id, message: 'Reminder: we leave Sweileh Circle at 9 AM sharp on Friday.', createdat: at(now - 2 * HOUR) },

    // b8: p3 <-> d2 on Zarqa -> Amman (published, tomorrow morning)
    { bookingId: b8.id, senderId: p3.id, receiverId: d2.id, message: 'Does the Zarqa bus stop near Mahes market?', isRead: true, readAt: at(now - 19 * HOUR), createdat: at(now - 20 * HOUR) },
    { bookingId: b8.id, senderId: d2.id, receiverId: p3.id, message: 'Yes, right by the main square. Seat 2 is yours.', isRead: true, readAt: at(now - 18 * HOUR), createdat: at(now - 19 * HOUR) },

    // Ticket 0 (p1, billing, open/unassigned) — user messages only, no reply yet
    { supportTicketId: tickets[0].id, senderId: p1.id, message: 'Hello, my payment history shows two pending amounts for booking MS000001A.', createdat: at(now - 30 * HOUR) },
    { supportTicketId: tickets[0].id, senderId: p1.id, message: 'Can you check if only one will actually be charged?', createdat: at(now - 29 * HOUR) },

    // Ticket 1 (d1, payout, assigned to admin) — back and forth, last user msg unread
    { supportTicketId: tickets[1].id, senderId: d1.id, receiverId: admin.id, message: 'Trip MS000001A fare was 7 JOD, 8% cut is 0.56, but my balance shows more deducted.', isRead: true, readAt: at(now - 27 * HOUR), createdat: at(now - 28 * HOUR) },
    { supportTicketId: tickets[1].id, senderId: admin.id, receiverId: d1.id, message: 'Thanks for reporting this. I am checking the transaction logs now.', isRead: true, readAt: at(now - 26 * HOUR), createdat: at(now - 27 * HOUR) },
    { supportTicketId: tickets[1].id, senderId: d1.id, receiverId: admin.id, message: 'Also the second trip from that day seems off by a similar amount.', createdat: at(now - 3 * HOUR) },

    // Ticket 4 (p2, referral question, resolved by moderator) — full conversation, all read
    { supportTicketId: tickets[4].id, senderId: p2.id, receiverId: moderator.id, message: 'How do referral codes work exactly?', isRead: true, readAt: at(now - 49 * HOUR), createdat: at(now - 50 * HOUR) },
    { supportTicketId: tickets[4].id, senderId: moderator.id, receiverId: p2.id, message: 'You share your code; when a new user completes their first trip, you both get credit.', isRead: true, readAt: at(now - 48 * HOUR), createdat: at(now - 49 * HOUR) },
    { supportTicketId: tickets[4].id, senderId: p2.id, receiverId: moderator.id, message: 'Got it, thanks! Where do I find my code?', isRead: true, readAt: at(now - 47 * HOUR), createdat: at(now - 48 * HOUR) },
    { supportTicketId: tickets[4].id, senderId: moderator.id, receiverId: p2.id, message: 'Profile, then Invite Friends. Closing this ticket — reopen if anything else comes up.', isRead: true, readAt: at(now - 46 * HOUR), createdat: at(now - 47 * HOUR) },
  ]);
  console.log(`[mock-seed] messages: ${await M.Message.count()}`);

  // ===== NOTIFICATIONS =====
  await M.Notification.bulkCreate([
    { userId: p1.id, type: 'booking_confirmed', title: 'Booking confirmed', body: 'Your seat on Amman → Irbid is confirmed. Reference MS000001A.', data: { booking_id: b1.id, trip_id: t1.id }, sentVia: ['push'] },
    { userId: p2.id, type: 'trip_reminder', title: 'Your trip started', body: 'Omar Al-Rashid started the trip Amman → Aqaba.', data: { trip_id: t2.id }, sentVia: ['push', 'in_app'] },
    { userId: d1.id, type: 'rating_received', title: 'New rating received', body: 'You received a new rating.', data: { rating: 5 }, sentVia: ['push'] },
    { userId: d5.id, type: 'subscription_expiring', title: 'Subscription expiring soon', body: 'Your Pro Annual plan expires in 5 days.', data: { days_remaining: 5 }, sentVia: ['push', 'in_app'] },
    { userId: admin.id, type: 'sos_alert', title: 'SOS alert triggered', body: 'Emergency alert raised during a live trip. Coordinates attached.', data: { trip_id: t2.id, lat: 31.2, lng: 35.7 }, sentVia: ['in_app'] },
    { userId: p3.id, type: 'system_announcement', title: 'New feature: favorite routes', body: 'You can now save routes and get matched faster.', data: {}, isRead: true, sentVia: ['in_app'] },
  ]);
  console.log(`[mock-seed] notifications: ${await M.Notification.count()}`);

  // ===== NOTIFICATION SETTINGS =====
  await M.NotificationSetting.bulkCreate([
    { userId: p1.id, notificationType: 'booking_confirmed', enabledInApp: true, enabledPush: true },
    { userId: p1.id, notificationType: 'trip_reminder', enabledInApp: true, enabledPush: true },
    { userId: p2.id, notificationType: 'booking_cancelled', enabledInApp: true, enabledPush: false },
    { userId: d1.id, notificationType: 'rating_received', enabledInApp: true, enabledPush: true },
    { userId: d5.id, notificationType: 'subscription_expiring', enabledInApp: true, enabledPush: false },
    { userId: p3.id, notificationType: 'sos_alert', enabledInApp: true, enabledPush: true },
  ]);
  console.log(`[mock-seed] notification_settings: ${await M.NotificationSetting.count()}`);

  // ===== FAVORITES =====
  await M.FavoriteDriver.bulkCreate([
    { passengerId: p1.id, driverId: d1.id },
    { passengerId: p2.id, driverId: d1.id },
    { passengerId: p3.id, driverId: d2.id },
    { passengerId: p4.id, driverId: d1.id },
    { passengerId: p5.id, driverId: d5.id },
  ]);
  await M.FavoriteRoute.bulkCreate([
    { passengerId: p1.id, originCity: 'Amman', destinationCity: 'Irbid', label: 'Home weekends' },
    { passengerId: p2.id, originCity: 'Amman', destinationCity: 'Aqaba', label: 'Diving trips' },
    { passengerId: p3.id, originCity: 'Amman', destinationCity: 'Jerash', label: 'Tourism' },
    { passengerId: p4.id, originCity: 'Zarqa', destinationCity: 'Amman', label: 'Work commute' },
    { passengerId: p5.id, originCity: 'Amman', destinationCity: 'Salt', label: 'Family visits' },
  ]);
  console.log(`[mock-seed] favorites: drivers=${await M.FavoriteDriver.count()} routes=${await M.FavoriteRoute.count()}`);

  // ===== RIDE REQUESTS + OFFERS =====
  const r1 = await M.RideRequest.create({ passengerId: p1.id, originPlace: 'Ras El Ain', originCity: 'Amman', originLat: 31.9560, originLng: 35.9330, originTime: at(now + 22 * HOUR), destinationPlace: 'Sweifieh', destinationCity: 'Amman', destinationLat: 31.9520, destinationLng: 35.8620, seatsNeeded: 1, maxBudget: 5, currency: 'JOD', attributesPreferred: { ac: true }, status: 'open', expiresAt: at(now + 26 * HOUR) });
  const r2 = await M.RideRequest.create({ passengerId: p2.id, originPlace: '7th Circle', originCity: 'Amman', originTime: at(now + 2 * DAY), destinationPlace: 'Aqaba City Center', destinationCity: 'Aqaba', arrivalDeadline: at(now + 2 * DAY + 5 * HOUR), seatsNeeded: 2, maxBudget: 40, currency: 'JOD', status: 'offered', expiresAt: at(now + 2 * DAY) });
  const r3 = await M.RideRequest.create({ passengerId: p3.id, originPlace: 'Dabouq', originCity: 'Amman', originTime: at(now + 3 * DAY), destinationPlace: 'Jerash Visitor Center', destinationCity: 'Jerash', seatsNeeded: 1, maxBudget: 8, currency: 'JOD', status: 'accepted', expiresAt: at(now + 3 * DAY) });
  await M.RideRequest.create({ passengerId: p4.id, originPlace: 'Zarqa Downtown', originCity: 'Zarqa', originTime: at(now - 2 * DAY), destinationPlace: 'Mahes', destinationCity: 'Amman', seatsNeeded: 1, maxBudget: 4, status: 'expired', expiresAt: at(now - 1 * DAY) });
  const r5 = await M.RideRequest.create({ passengerId: p5.id, originPlace: 'Wakalat St', originCity: 'Amman', originTime: at(now + 30 * HOUR), destinationPlace: 'Dead Sea Amman Beach', destinationCity: 'Dead Sea', seatsNeeded: 1, maxBudget: 7, status: 'cancelled', expiresAt: at(now + 34 * HOUR) });

  await M.RequestOffer.bulkCreate([
    { requestId: r1.id, driverId: d1.id, offeredFare: 5, message: 'I pass by Ras El Ain every evening.', status: 'sent' },
    { requestId: r2.id, driverId: d1.id, offeredFare: 38, message: 'Leaving Friday morning, 2 seats free.', status: 'sent' },
    { requestId: r2.id, driverId: d2.id, offeredFare: 42, status: 'declined' },
    { requestId: r3.id, driverId: d2.id, tripId: t6.id, offeredFare: 7, message: 'Close to your deadline, I can detour.', status: 'accepted' },
    { requestId: r5.id, driverId: d1.id, tripId: t3.id, offeredFare: 6, message: 'Same beach, join my published trip.', status: 'expired' },
  ]);
  console.log(`[mock-seed] ride_requests: ${await M.RideRequest.count()}, request_offers: ${await M.RequestOffer.count()}`);

  // ===== AUDIT LOGS =====
  await M.AuditLog.bulkCreate([
    { tableName: 'users', recordId: d4.id, action: 'UPDATE', oldData: { status: 'active' }, newData: { status: 'suspended' }, performedBy: admin.id, ipAddress: '127.0.0.1', userAgent: 'mock-seed' },
    { tableName: 'penalties', recordId: c2.id, action: 'INSERT', newData: { type: 'suspension', user: d4.id }, performedBy: admin.id, ipAddress: '127.0.0.1', userAgent: 'mock-seed' },
    { tableName: 'complaints', recordId: c1.id, action: 'UPDATE', oldData: { status: 'reviewing' }, newData: { status: 'resolved' }, performedBy: admin.id, ipAddress: '127.0.0.1', userAgent: 'mock-seed' },
    { tableName: 'driver_subscriptions', recordId: s1.id, action: 'UPDATE', oldData: { status: 'pending_approval' }, newData: { status: 'active' }, performedBy: admin.id, ipAddress: '127.0.0.1', userAgent: 'mock-seed' },
    { tableName: 'vehicles', recordId: v1.id, action: 'UPDATE', oldData: { isVerified: false }, newData: { isVerified: true }, performedBy: admin.id, ipAddress: '127.0.0.1', userAgent: 'mock-seed' },
    { tableName: 'trips', recordId: t6.id, action: 'INSERT', newData: { id: t6.id, driver: d2.id }, performedBy: d2.id, ipAddress: '127.0.0.1', userAgent: 'mock-seed' },
  ]);
  console.log(`[mock-seed] audit_logs: ${await M.AuditLog.count()}`);
}

module.exports = { seedMockData };

// CLI mode (`node seed-mock.js` / `npm run seed:mock`): destructive reset + reseed.
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      try {
        await resetTables();
      } catch (err) {
        console.error('[mock-seed] could not truncate tables — run `npm run db:init` first.', err.message);
        process.exit(1);
      }
      await runInserts();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Mock data seeded successfully!');
      console.log('  All mock passwords: Test@1234');
      console.log('  Admin: ' + (process.env.SEED_ADMIN_PHONE || '+962700000099') + ' / env or Admin@1234');
      console.log('  Drivers: +962790000001 .. +962790000005');
      console.log('  Passengers: +962780000001 .. +962780000005');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await sequelize.close();
      process.exit(0);
    } catch (err) {
      console.error('[mock-seed] failed:', err);
      process.exit(1);
    }
  })();
}
