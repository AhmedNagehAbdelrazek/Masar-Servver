import { body, ValidationChain } from 'express-validator';
import V from '../../config/messages/validation-keys';

export const loginValidation: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage(V.USERNAME_IS_REQUIRED),
  body('password')
    .trim()
    .notEmpty()
    .withMessage(V.PASSWORD_IS_REQUIRED),
];




const _exported = { loginValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { loginValidation };
  // @ts-ignore
  module.exports.loginValidation = loginValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
