// Dedicated developer accounts. Mirrors main-server/config/constants.ts.
// The numbers are intentionally separate from the legacy TEST_PHONES so they
// can be seeded in production and purged through the admin-only endpoint.
export const TEST_PHONES = ['+962700000000', '+962711111111'] as const;
export const TEST_OTP = '000000';

export const DEV_DRIVER_PHONE: string =
  process.env.DEV_DRIVER_PHONE?.trim() || '+962700000001';
export const DEV_PASSENGER_PHONE: string =
  process.env.DEV_PASSENGER_PHONE?.trim() || '+962700000002';
export const DEV_PHONES = [DEV_DRIVER_PHONE, DEV_PASSENGER_PHONE] as const;
export const DEV_ACCOUNT_PASSWORD: string =
  process.env.DEV_ACCOUNT_PASSWORD || 'Test@1234';
export const FIXED_OTP_PHONES = [
  ...new Set([...TEST_PHONES, ...DEV_PHONES]),
] as const;
