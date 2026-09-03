import { body, ValidationChain, Meta } from 'express-validator';
import { validatePhone } from '../phoneValidator';
import V from '../../config/messages/validation-keys';

const passwordRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerPhoneValidation: ValidationChain[] = [
  body('country_code')
    .trim()
    .notEmpty().withMessage(V.COUNTRY_CODE_IS_REQUIRED)
    .isAlpha().withMessage(V.COUNTRY_CODE_MUST_CONTAIN_ONLY_LETTERS)
    .isLength({ min: 2, max: 2 }).withMessage(V.COUNTRY_CODE_MUST_BE_2_LETTERS_E_G_JO_AE),
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED)
    .custom((value: string, meta: Meta): boolean => {
      const req = (meta as unknown as { req: Record<string, unknown> & { body: Record<string, unknown> } }).req;
      const countryCode = req.body.country_code as string | undefined;
      if (!countryCode) {
        throw new Error(V.COUNTRY_CODE_IS_REQUIRED as string);
      }
      const result = validatePhone(countryCode, value) as { valid: boolean; error?: string; fullPhone?: string; countryCode?: string };
      if (!result.valid) {
        throw new Error(result.error as string);
      }
      // Store the normalized full phone on the request for downstream use
      (req.body as Record<string, unknown>).phone = result.fullPhone;
      (req.body as Record<string, unknown>).country_code = result.countryCode;
      return true;
    }),
  body('role')
    .notEmpty().withMessage(V.ROLE_IS_REQUIRED as string)
    .isIn(['passenger', 'driver']).withMessage(V.ROLE_MUST_BE_PASSENGER_OR_DRIVER as string),
];

export const verifyOTPValidation: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED as string),
  body('otp')
    .trim()
    .notEmpty().withMessage(V.OTP_IS_REQUIRED as string)
    .isLength({ min: 6, max: 6 }).withMessage(V.OTP_MUST_BE_6_DIGITS as string)
    .isNumeric().withMessage(V.OTP_MUST_BE_NUMERIC as string),
];

export const registerPasswordValidation: ValidationChain[] = [
  body('password')
    .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED as string)
    .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND as string),
  body('confirmPassword')
    .notEmpty().withMessage(V.CONFIRM_PASSWORD_IS_REQUIRED as string)
    .custom((value: string, meta: Meta): boolean => {
      const req = (meta as unknown as { req: { body: Record<string, unknown> } }).req;
      if (value !== (req.body as Record<string, unknown>).password) {
        throw new Error(V.PASSWORDS_DO_NOT_MATCH as string);
      }
      return true;
    }),
];

export const onboardingPassengerProfileValidation: ValidationChain[] = [
  body('fullname')
    .trim()
    .notEmpty().withMessage(V.FULL_NAME_IS_REQUIRED as string)
    .isLength({ max: 120 }).withMessage(V.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS as string),
  body('national_id')
    .trim()
    .notEmpty().withMessage(V.NATIONAL_ID_IS_REQUIRED as string)
    .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_5_30_CHARACTERS as string),
  body('age')
    .notEmpty().withMessage(V.AGE_IS_REQUIRED as string)
    .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_AN_INTEGER_BETWEEN_18_AND_100 as string),
  body('home_address')
    .trim()
    .notEmpty().withMessage(V.HOME_ADDRESS_IS_REQUIRED as string)
    .isString().withMessage(V.HOME_ADDRESS_MUST_BE_A_STRING as string),
  body('gender')
    .notEmpty().withMessage(V.GENDER_IS_REQUIRED as string)
    .isIn(['male', 'female']).withMessage(V.GENDER_MUST_BE_MALE_OR_FEMALE as string),
];

export const loginValidation: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED as string),
  body('password')
    .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED as string),
];

export const forgotPasswordValidation: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED as string),
];

export const resetPasswordValidation: ValidationChain[] = [
  body('password')
    .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED as string)
    .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND as string),
  body('confirmPassword')
    .notEmpty().withMessage(V.CONFIRM_PASSWORD_IS_REQUIRED as string)
    .custom((value: string, meta: Meta): boolean => {
      const req = (meta as unknown as { req: { body: Record<string, unknown> } }).req;
      if (value !== (req.body as Record<string, unknown>).password) {
        throw new Error(V.PASSWORDS_DO_NOT_MATCH as string);
      }
      return true;
    }),
];

export const resendOTPValidation: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED as string),
  body('purpose')
    .notEmpty().withMessage(V.PURPOSE_IS_REQUIRED as string)
    .isIn(['register', 'forgot_password']).withMessage(V.PURPOSE_MUST_BE_REGISTER_OR_FORGOT_PASSWORD as string),
];

export const refreshValidation: ValidationChain[] = [
  body('refresh_token')
    .notEmpty().withMessage(V.REFRESH_TOKEN_IS_REQUIRED as string),
];

export const onboardingProfileValidation: ValidationChain[] = [
  body('fullName')
    .trim()
    .notEmpty().withMessage(V.FULL_NAME_IS_REQUIRED as string)
    .isLength({ max: 120 }).withMessage(V.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS as string),
  body('age')
    .notEmpty().withMessage(V.AGE_IS_REQUIRED as string)
    .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_BETWEEN_18_AND_100 as string),
  body('gender')
    .notEmpty().withMessage(V.GENDER_IS_REQUIRED as string)
    .isIn(['male', 'female']).withMessage(V.GENDER_MUST_BE_MALE_OR_FEMALE as string),
  body('userIdentificationFront')
    .notEmpty().withMessage(V.FRONT_ID_IMAGE_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('userIdentificationBack')
    .notEmpty().withMessage(V.BACK_ID_IMAGE_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('linceseFront')
    .notEmpty().withMessage(V.FRONT_LICENSE_IMAGE_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('linceseBack')
    .notEmpty().withMessage(V.BACK_LICENSE_IMAGE_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('personalImageWithId')
    .notEmpty().withMessage(V.PERSONAL_IMAGE_WITH_ID_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('nationalID')
    .trim()
    .notEmpty().withMessage(V.NATIONAL_ID_IS_REQUIRED as string)
    .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_BETWEEN_5_AND_30_CHARACTERS as string),
];

export const onboardingVehicleValidation: ValidationChain[] = [
  body('vehicleType')
    .notEmpty().withMessage(V.VEHICLE_TYPE_IS_REQUIRED as string)
    .isIn(['sedan', 'suv', 'van', 'bus', 'hatchback']).withMessage(V.INVALID_VEHICLE_TYPE as string),
  body('manufacturer')
    .trim()
    .notEmpty().withMessage(V.MANUFACTURER_IS_REQUIRED as string)
    .isLength({ max: 80 }).withMessage(V.MANUFACTURER_MUST_BE_AT_MOST_80_CHARACTERS as string),
  body('model')
    .trim()
    .notEmpty().withMessage(V.MODEL_IS_REQUIRED as string)
    .isLength({ max: 80 }).withMessage(V.MODEL_MUST_BE_AT_MOST_80_CHARACTERS as string),
  body('modelYear')
    .optional()
    .isInt().withMessage(V.MODEL_YEAR_MUST_BE_A_VALID_YEAR as string)
    .custom((value: unknown): boolean => {
      const currentYear: number = new Date().getFullYear();
      const minYear: number = currentYear - 10;
      const numValue = Number(value);
      if (numValue < minYear || numValue > currentYear) {
        throw new Error(`Model year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
      }
      return true;
    }),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage(V.COLOR_MUST_BE_AT_MOST_30_CHARACTERS as string),
  body('plateNumber')
    .trim()
    .notEmpty().withMessage(V.PLATE_NUMBER_IS_REQUIRED as string)
    .isLength({ max: 20 }).withMessage(V.PLATE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS as string),
  body('codeNumber')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage(V.CODE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS as string),
  body('seats')
    .notEmpty().withMessage(V.NUMBER_OF_SEATS_IS_REQUIRED as string)
    .isInt({ min: 1, max: 50 }).withMessage(V.SEATS_MUST_BE_BETWEEN_1_AND_50 as string),
  body('registrationDocFront')
    .notEmpty().withMessage(V.FRONT_REGISTRATION_DOC_IMAGE_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('registrationDocBack')
    .notEmpty().withMessage(V.BACK_REGISTRATION_DOC_IMAGE_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('vehiclePhotoFront')
    .notEmpty().withMessage(V.FRONT_VEHICLE_PHOTO_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
  body('vehiclePhotoBack')
    .notEmpty().withMessage(V.BACK_VEHICLE_PHOTO_IS_REQUIRED as string)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER as string),
];

export const changePasswordValidation: ValidationChain[] = [
  body('current_password')
    .notEmpty().withMessage(V.CURRENT_PASSWORD_IS_REQUIRED as string),
  body('new_password')
    .notEmpty().withMessage(V.NEW_PASSWORD_IS_REQUIRED as string)
    .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND as string)
    .custom((value: string, meta: Meta): boolean => {
      const req = (meta as unknown as { req: { body: Record<string, unknown> } }).req;
      if (value === (req.body as Record<string, unknown>).current_password) {
        throw new Error(V.NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD as string);
      }
      return true;
    }),
];

const authValidator = {
  registerPhoneValidation,
  verifyOTPValidation,
  registerPasswordValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  resendOTPValidation,
  refreshValidation,
  onboardingProfileValidation,
  onboardingPassengerProfileValidation,
  onboardingVehicleValidation,
};

export default authValidator;
module.exports = authValidator;
