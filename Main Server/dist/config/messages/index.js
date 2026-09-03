"use strict";
/**
 * Locale registry. `APP_MESSAGES` (config/messages/app.js) holds every
 * business error/success message keyed by ALL_CAPS keys used at call sites.
 * `VALIDATION_MESSAGES` (config/messages/validation.js) maps inline
 * express-validator withMessage() texts to bilingual overrides.
 */
const { APP_MESSAGES } = require('./app');
const { VALIDATION_MESSAGES } = require('./validation');
module.exports = { MESSAGES: APP_MESSAGES, VALIDATION_MESSAGES };
//# sourceMappingURL=index.js.map