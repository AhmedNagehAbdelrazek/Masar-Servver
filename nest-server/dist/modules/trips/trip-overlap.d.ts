import { PrismaService } from '../../prisma/prisma.service.js';
export declare function tripWindowEnd(start: Date): Date;
export declare function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean;
export declare function assertNoOverlappingTrip(prisma: PrismaService, driverId: string, { departureTime, isRecurring, recurrenceDays, recurrenceEndDate, excludeTripId, }: {
    departureTime: Date;
    isRecurring: boolean;
    recurrenceDays: number[] | null;
    recurrenceEndDate: string | Date | null;
    excludeTripId?: string | null;
}): Promise<void>;
