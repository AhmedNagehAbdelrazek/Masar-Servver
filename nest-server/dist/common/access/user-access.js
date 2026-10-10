import { ForbiddenException, NotFoundException } from '@nestjs/common';
export async function loadDriverUser(prisma, userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    return user;
}
export function ensureReadable(user) {
    if (user.status === 'banned') {
        throw new ForbiddenException({ message: 'ACCOUNT_IS_BANNED', code: 'FORBIDDEN' });
    }
}
export function ensureOperational(user) {
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
//# sourceMappingURL=user-access.js.map