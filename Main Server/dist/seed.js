"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = seedAdmin;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("./config/database"));
const index_1 = require("./Models/index");
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 12;
async function seedAdmin() {
    const phone = process.env.SEED_ADMIN_PHONE;
    const username = process.env.SEED_ADMIN_USERNAME;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!phone || !username || !password) {
        console.log('[seed] SEED_ADMIN_PHONE, SEED_ADMIN_USERNAME, or SEED_ADMIN_PASSWORD not set — skipping admin seed');
        return;
    }
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const [user, created] = await index_1.User.findOrCreate({
        where: { phone },
        defaults: {
            phone,
            role: 'admin',
            fullName: username,
            passwordHash,
            isVerified: true,
            locale: 'en',
        },
    });
    if (!created) {
        await user.update({ passwordHash, fullName: username });
        console.log(`[seed] Admin updated: ${username} (${phone})`);
    }
    else {
        console.log(`[seed] Admin created: ${username} (${phone})`);
    }
}
const TEST_ACCOUNTS = [
    {
        phone: '+962700000000',
        countryCode: 'JO',
        role: 'driver',
        fullName: 'Test Driver',
        password: 'Test@1234',
        isVerified: true,
        locale: 'ar',
    },
    {
        phone: '+962711111111',
        countryCode: 'JO',
        role: 'passenger',
        fullName: 'Test Passenger',
        password: 'Test@1234',
        isVerified: true,
        locale: 'ar',
    },
];
async function _seed() {
    console.log('Seeding database...');
    await database_1.default.authenticate();
    console.log('Database connected.');
    await seedAdmin();
    console.log('Creating test accounts...');
    for (const account of TEST_ACCOUNTS) {
        const passwordHash = await bcrypt_1.default.hash(account.password, SALT_ROUNDS);
        const [user, created] = await index_1.User.findOrCreate({
            where: { phone: account.phone },
            defaults: {
                phone: account.phone,
                countryCode: account.countryCode,
                role: account.role,
                fullName: account.fullName,
                passwordHash,
                isVerified: account.isVerified,
                locale: account.locale,
            },
        });
        if (!created) {
            await user.update({ passwordHash });
            console.log(`  Updated: ${account.phone} (${account.role})`);
        }
        else {
            console.log(`  Created: ${account.phone} (${account.role})`);
        }
    }
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Test Accounts Ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const account of TEST_ACCOUNTS) {
        console.log(`  ${account.fullName}`);
        console.log(`    Phone:    ${account.phone}`);
        console.log(`    Password: ${account.password}`);
        console.log(`    Role:     ${account.role}`);
        console.log('');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Sign in via: POST /api/auth/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await database_1.default.close();
    console.log('Seeding complete!');
}
exports.default = { seedAdmin };
module.exports = { seedAdmin };
//# sourceMappingURL=seed.js.map