import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

// Port of Main Server/utils/userAccess.ts.
export async function loadDriverUser(
  prisma: PrismaService,
  userId: string,
): Promise<{ id: string; status: string } & Record<string, unknown>> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
  return user as unknown as { id: string; status: string } & Record<string, unknown>;
}

export function ensureReadable(user: { status: string }): void {
  if (user.status === 'banned') {
    throw new ForbiddenException({ message: 'ACCOUNT_IS_BANNED', code: 'FORBIDDEN' });
  }
}

export function ensureOperational(user: { status: string }): void {
  if (user.status === 'banned') {
    throw new ForbiddenException({ message: 'ACCOUNT_IS_BANNED', code: 'FORBIDDEN' });
  }
  if (user.status === 'suspended') {
    throw new ForbiddenException({
      message: 'SUSPENDED_ACCOUNTS_CANNOT_PERFORM_THIS_ACTION',
      code: 'FORBIDDEN',
    });
  }
}
