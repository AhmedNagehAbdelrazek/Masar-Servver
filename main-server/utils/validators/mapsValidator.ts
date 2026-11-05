import { body, param, ValidationChain } from 'express-validator';
import { PICKUP_TYPE, PICKUP_STATUS } from '../../config/constants';
import V from '../../config/messages/validation-keys';

// : reuses tripValidator's lat/lng + trip_id chains where possible — only
// pickup-specific shapes live here. All coordinates ride the same decimal rules.
const latRules = (field: string, key: string): ValidationChain =>
  body(field).isDecimal().withMessage((V as unknown as Record<string, string>)[key]).custom((value: unknown) => {
    const n = parseFloat(String(value));
    if (n < -90 || n > 90) throw new Error((V as unknown as Record<string, string>)[key]);
    return true;
  });

const lngRules = (field: string, key: string): ValidationChain =>
  body(field).isDecimal().withMessage((V as unknown as Record<string, string>)[key]).custom((value: unknown) => {
    const n = parseFloat(String(value));
    if (n < -180 || n > 180) throw new Error((V as unknown as Record<string, string>)[key]);
    return true;
  });

export const routePreviewValidation: ValidationChain[] = [
  body('origin_lat').optional().isDecimal().withMessage((V as unknown as Record<string, string>).ORIGIN_LATITUDE_MUST_BE_A_DECIMAL),
  body('origin_lng').optional().isDecimal().withMessage((V as unknown as Record<string, string>).ORIGIN_LONGITUDE_MUST_BE_A_DECIMAL),
  body('destination_lat').optional().isDecimal().withMessage((V as unknown as Record<string, string>).DESTINATION_LATITUDE_MUST_BE_A_DECIMAL),
  body('destination_lng').optional().isDecimal().withMessage((V as unknown as Record<string, string>).DESTINATION_LONGITUDE_MUST_BE_A_DECIMAL),
  body('stops').optional().isArray().withMessage(V.WAYPOINTS_MUST_BE_AN_ARRAY),
  // : flat fields win; nested {origin, destination} objects are the fallback.
  body().custom((_, { req }) => {
    const b = (req as unknown as { body: Record<string, unknown> }).body || {};
    const flat = b.origin_lat != null && b.origin_lng != null && b.destination_lat != null && b.destination_lng != null;
    const nested = b.origin != null && b.destination != null;
    if (!flat && !nested) throw new Error(V.ORIGIN_AND_DESTINATION_ARE_REQUIRED);
    return true;
  }),
];

export const reverseGeocodeBodyValidation: ValidationChain[] = [
  latRules('lat', 'ORIGIN_LATITUDE_MUST_BE_A_DECIMAL'),
  lngRules('lng', 'ORIGIN_LONGITUDE_MUST_BE_A_DECIMAL'),
];

export const pickupPreviewValidation: ValidationChain[] = [
  body('pickup_type').optional().isIn(Object.values(PICKUP_TYPE)).withMessage(V.PICKUP_TYPE_MUST_BE_ONE_OF_STOP_CUSTOM),
  body('pickup_stop_id').optional().isUUID().withMessage(V.PICKUP_STOP_ID_MUST_BE_A_VALID_UUID),
  body('lat').optional().isDecimal().withMessage(V.ORIGIN_LATITUDE_MUST_BE_A_DECIMAL),
  body('lng').optional().isDecimal().withMessage(V.ORIGIN_LONGITUDE_MUST_BE_A_DECIMAL),
];

export const pickupPayloadValidation: ValidationChain[] = [
  body('pickup_type').notEmpty().withMessage(V.PICKUP_TYPE_MUST_BE_ONE_OF_STOP_CUSTOM).isIn(Object.values(PICKUP_TYPE)).withMessage(V.PICKUP_TYPE_MUST_BE_ONE_OF_STOP_CUSTOM),
  body('pickup_stop_id').optional().isUUID().withMessage(V.PICKUP_STOP_ID_MUST_BE_A_VALID_UUID),
  body('lat').optional().isDecimal().withMessage(V.ORIGIN_LATITUDE_MUST_BE_A_DECIMAL),
  body('lng').optional().isDecimal().withMessage(V.ORIGIN_LONGITUDE_MUST_BE_A_DECIMAL),
  body('pickup_label').optional().trim().isLength({ max: 255 }).withMessage(V.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
];

export const replaceStopsValidation: ValidationChain[] = [
  // : shape only — the count cap lives in tripService (single enforcer).
  body('stops').isArray().withMessage(V.WAYPOINTS_MUST_BE_AN_ARRAY),
];

export const pickupStatusValidation: ValidationChain[] = [  param('booking_id').isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
  body('pickup_status')
    .notEmpty()
    .withMessage(V.PICKUP_STATUS_MUST_BE_ONE_OF_ARRIVED_PICKED_UP_MISSED)
    .isIn([PICKUP_STATUS.ARRIVED, PICKUP_STATUS.PICKED_UP, PICKUP_STATUS.MISSED])
    .withMessage(V.PICKUP_STATUS_MUST_BE_ONE_OF_ARRIVED_PICKED_UP_MISSED),
];
