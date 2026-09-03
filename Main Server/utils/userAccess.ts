import { User } from '../Models';
import { ApiErrors } from './ApiError';
import { USER_STATUS } from '../config/constants';

export interface UserLike {
  id?: string;
  status: string;
}

type UserModel = {
  findByPk: (id: string) => Promise<UserLike | null>;
};

const UserModelTyped = User as unknown as UserModel;

export async function loadDriverUser(userId: string): Promise<UserLike> {
  const user: UserLike | null = await UserModelTyped.findByPk(userId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  return user;
}

export function ensureReadable(user: UserLike): void {
  if (user.status === USER_STATUS.BANNED) {
    throw ApiErrors.forbidden('ACCOUNT_IS_BANNED');
  }
}

export function ensureOperational(user: UserLike): void {
  if (user.status === USER_STATUS.BANNED) {
    throw ApiErrors.forbidden('ACCOUNT_IS_BANNED');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiErrors.forbidden('SUSPENDED_ACCOUNTS_CANNOT_PERFORM_THIS_ACTION');
  }
}

const userAccess = { loadDriverUser, ensureReadable, ensureOperational };
export default userAccess;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { loadDriverUser, ensureReadable, ensureOperational };
  // @ts-ignore
  module.exports.loadDriverUser = loadDriverUser;
  // @ts-ignore
  module.exports.ensureReadable = ensureReadable;
  // @ts-ignore
  module.exports.ensureOperational = ensureOperational;
  // @ts-ignore
  module.exports.default = userAccess;
}
