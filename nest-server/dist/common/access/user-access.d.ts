import { PrismaService } from '../../prisma/prisma.service.js';
export declare function loadDriverUser(prisma: PrismaService, userId: string): Promise<{
    id: string;
    status: string;
} & Record<string, unknown>>;
export declare function ensureReadable(user: {
    status: string;
}): void;
export declare function ensureOperational(user: {
    status: string;
}): void;
