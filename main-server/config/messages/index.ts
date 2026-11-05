import { APP_MESSAGES } from './app';
import { VALIDATION_MESSAGES } from './validation';

export const MESSAGES = APP_MESSAGES;
export { VALIDATION_MESSAGES };
export { APP_MESSAGES };

export default { MESSAGES, VALIDATION_MESSAGES };

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { MESSAGES, VALIDATION_MESSAGES };
  // @ts-ignore
  module.exports.MESSAGES = MESSAGES;
  // @ts-ignore
  module.exports.VALIDATION_MESSAGES = VALIDATION_MESSAGES;
  // @ts-ignore
  module.exports.default = { MESSAGES, VALIDATION_MESSAGES };
}
