import { Router } from 'express';
import { param } from 'express-validator';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/adminPassengerController';

const admin = [protect, roleGuard(['admin'])];
const passengerId = [param('passenger_id').isUUID().withMessage('PASSENGER_ID_MUST_BE_A_VALID_UUID')];

router.get('/passengers/stats', ...admin, c.getStats);
router.get('/passengers/export', ...admin, c.exportPassengers);
router.get('/passengers', ...admin, c.listPassengers);
router.get('/passengers/:passenger_id', ...admin, ...passengerId, validate, c.getOverview);
router.get('/passengers/:passenger_id/account-log', ...admin, ...passengerId, validate, c.getAccountLog);
router.get('/passengers/:passenger_id/bookings', ...admin, ...passengerId, validate, c.listBookings);
router.get('/passengers/:passenger_id/trip-requests', ...admin, ...passengerId, validate, c.listTripRequests);
router.get('/passengers/:passenger_id/complaints', ...admin, ...passengerId, validate, c.listComplaints);
router.get('/passengers/:passenger_id/ratings', ...admin, ...passengerId, validate, c.listRatings);

router.post('/passengers/:passenger_id/notifications', ...admin, ...passengerId, validate, c.sendNotification);
router.post('/passengers/:passenger_id/warnings', ...admin, ...passengerId, validate, c.sendWarning);
router.post('/passengers/:passenger_id/suspensions/temporary', ...admin, ...passengerId, validate, c.suspendTemporary);
router.post('/passengers/:passenger_id/suspensions/permanent', ...admin, ...passengerId, validate, c.suspendPermanent);
router.post('/passengers/:passenger_id/account-status', ...admin, ...passengerId, validate, c.applyAccountStatus);

export default router;
module.exports = router;
