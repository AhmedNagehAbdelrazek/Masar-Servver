var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SeedService_1;
import { Injectable, Logger } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
const TEST_ACCOUNTS = [
    {
        phone: '+962700000000',
        countryCode: 'JO',
        role: 'driver',
        fullName: 'Test Driver',
        password: 'Test@1234',
        locale: 'ar',
    },
    {
        phone: '+962711111111',
        countryCode: 'JO',
        role: 'passenger',
        fullName: 'Test Passenger',
        password: 'Test@1234',
        locale: 'ar',
    },
];
let SeedService = SeedService_1 = class SeedService {
    prisma;
    logger = new Logger(SeedService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seed() {
        if (process.env.NODE_ENV === 'test')
            return;
        if (process.env.SEED_ON_BOOT === 'false') {
            this.logger.log('SEED_ON_BOOT=false, skipping boot seed.');
            return;
        }
        await this.ensureAdmin();
        if (process.env.NODE_ENV !== 'production') {
            await this.ensureTestAccounts();
        }
    }
    saltRounds() {
        const parsed = parseInt(process.env.SALT_ROUNDS ?? '', 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
    }
    async ensureAdmin() {
        const phone = process.env.SEED_ADMIN_PHONE;
        const username = process.env.SEED_ADMIN_USERNAME;
        const password = process.env.SEED_ADMIN_PASSWORD;
        if (!phone || !username || !password) {
            this.logger.warn('SEED_ADMIN_* not fully set, skipping admin seed.');
            return;
        }
        const existing = await this.prisma.user.findFirst({ where: { phone }, select: { id: true } });
        if (existing) {
            this.logger.log(`Admin ${phone} already present, left untouched.`);
            return;
        }
        await this.prisma.user.create({
            data: {
                phone,
                role: 'admin',
                fullName: username,
                passwordHash: await bcrypt.hash(password, this.saltRounds()),
                countryCode: 'JO',
                isVerified: true,
                locale: 'en',
            },
        });
        this.logger.log(`Admin seeded: ${username} (${phone}).`);
    }
    async ensureTestAccounts() {
        for (const account of TEST_ACCOUNTS) {
            const existing = await this.prisma.user.findFirst({
                where: { phone: account.phone },
                select: { id: true },
            });
            if (existing) {
                this.logger.log(`Test account ${account.phone} already present, left untouched.`);
                continue;
            }
            await this.prisma.user.create({
                data: {
                    phone: account.phone,
                    countryCode: account.countryCode,
                    role: account.role,
                    fullName: account.fullName,
                    passwordHash: await bcrypt.hash(account.password, this.saltRounds()),
                    isVerified: true,
                    locale: account.locale,
                },
            });
            this.logger.log(`Test account seeded: ${account.phone} (${account.role}).`);
        }
    }
};
SeedService = SeedService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], SeedService);
export { SeedService };
//# sourceMappingURL=seed.service.js.map