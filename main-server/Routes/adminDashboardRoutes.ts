import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/adminDashboardController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { driverIdParamValidation, documentKeyParamValidation, statusBodyValidation, accountActionBodyValidation, rejectReasonBodyValidation, recentTripsQueryValidation, driversListValidation, driverTripsQueryValidation, reservationsQueryValidation, } from '../utils/validators/adminDashboardValidator';

// ===== US1: Global dashboard =====
router.get('/summary', protect, roleGuard(['admin']), c.getSummary);
router.get('/recent-trips', protect, roleGuard(['admin']), ...recentTripsQueryValidation, validate, c.getRecentTrips);
router.get('/top-routes', protect, roleGuard(['admin']), c.getTopRoutes);
router.get('/pending-requests', protect, roleGuard(['admin']), ...recentTripsQueryValidation, validate, c.getPendingRequests);
router.get('/latest-complaints', protect, roleGuard(['admin']), ...recentTripsQueryValidation, validate, c.getLatestComplaints);

// ===== US2: Drivers directory (static routes BEFORE :driver_id) =====
router.get('/drivers', protect, roleGuard(['admin']), ...driversListValidation, validate, c.listDrivers);
router.get('/drivers/stats/summary', protect, roleGuard(['admin']), c.getDriverStats);

// ===== US3: Driver dossier =====
router.get('/drivers/:driver_id', protect, roleGuard(['admin']), ...driverIdParamValidation, validate, c.getDriverHeader);
router.get('/drivers/:driver_id/overview', protect, roleGuard(['admin']), ...driverIdParamValidation, validate, c.getDriverOverview);
router.get('/drivers/:driver_id/trips', protect, roleGuard(['admin']), ...driverIdParamValidation, ...driverTripsQueryValidation, validate, c.listDriverTrips);
router.get('/drivers/:driver_id/evaluations', protect, roleGuard(['admin']), ...driverIdParamValidation, ...recentTripsQueryValidation, validate, c.getDriverEvaluations);
router.get('/drivers/:driver_id/account-log', protect, roleGuard(['admin']), ...driverIdParamValidation, validate, c.getAccountLog);
router.get('/drivers/:driver_id/car', protect, roleGuard(['admin']), ...driverIdParamValidation, validate, c.getCarDetails);
router.get('/drivers/:driver_id/documents', protect, roleGuard(['admin']), ...driverIdParamValidation, validate, c.getDocuments);

// ===== US4: Actions =====
router.post('/drivers/:driver_id/status', protect, roleGuard(['admin']), ...driverIdParamValidation, ...statusBodyValidation, validate, c.setDriverStatus);
router.post('/drivers/:driver_id/account-status', protect, roleGuard(['admin']), ...driverIdParamValidation, ...accountActionBodyValidation, validate, c.applyStandingAction);
router.post('/drivers/:driver_id/documents/:document_key/approve', protect, roleGuard(['admin']), ...driverIdParamValidation, ...documentKeyParamValidation, validate, c.approveDocument);
router.post('/drivers/:driver_id/documents/:document_key/reject', protect, roleGuard(['admin']), ...driverIdParamValidation, ...documentKeyParamValidation, ...rejectReasonBodyValidation, validate, c.rejectDocument);

// ===== US5: Shared listings =====
router.get('/reservations', protect, roleGuard(['admin']), ...reservationsQueryValidation, validate, c.listReservations);

export default router;
module.exports = router;
