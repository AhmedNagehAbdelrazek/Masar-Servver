import { PrismaService } from '../prisma/prisma.service.js';
export declare class SeedService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    seed(): Promise<void>;
    private saltRounds;
    private ensureAdmin;
    private ensureTestAccounts;
}
