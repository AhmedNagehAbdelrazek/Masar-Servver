const adminDashboardService = require('../Services/adminDashboardService');
const { successResponse } = require('../utils/httpResponse');
const auditService = require('../Services/auditService');
const { markResource } = auditService;
const catchAsync = require('../utils/catchAsync');

// ===== US1: Global dashboard =====

const getSummary = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getSummary());
});

const getRecentTrips = catchAsync(async (req, res) => {
  const result = await adminDashboardService.getRecentTrips(req.query);
  successResponse(res, result);
});

const getTopRoutes = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getTopRoutes());
});

const getPendingRequests = catchAsync(async (req, res) => {
  const result = await adminDashboardService.getPendingRequests(req.query);
  successResponse(res, result);
});

const getLatestComplaints = catchAsync(async (req, res) => {
  const result = await adminDashboardService.getLatestComplaints(req.query);
  successResponse(res, result);
});

// ===== US2: Drivers directory =====

const listDrivers = catchAsync(async (req, res) => {
  const result = await adminDashboardService.listDrivers(req.query);
  successResponse(res, result);
});

const getDriverStats = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getDriverStats());
});

// ===== US3: Driver dossier =====

const getDriverHeader = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getDriverHeader(req.params.driver_id));
});

const getDriverOverview = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getDriverOverview(req.params.driver_id));
});

const listDriverTrips = catchAsync(async (req, res) => {
  const result = await adminDashboardService.listDriverTrips(req.params.driver_id, req.query);
  successResponse(res, result);
});

const getDriverEvaluations = catchAsync(async (req, res) => {
  const result = await adminDashboardService.getDriverEvaluations(req.params.driver_id, req.query);
  successResponse(res, result);
});

const getAccountLog = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getAccountLog(req.params.driver_id));
});

const getCarDetails = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getCarDetails(req.params.driver_id));
});

const getDocuments = catchAsync(async (req, res) => {
  successResponse(res, await adminDashboardService.getDocuments(req.params.driver_id));
});

// ===== US4: Actions =====

const setDriverStatus = catchAsync(async (req, res) => {
  const result = await adminDashboardService.setDriverStatus(req.user.id, req.params.driver_id, req.body.status);
  auditService.track({
    action: `dashboard.driver_status.${req.body.status}`,
    resourceType: 'driver',
    resourceId: req.params.driver_id,
    actorId: req.user.id,
    payload: { status: req.body.status },
  });
  markResource(res, { type: 'driver', id: req.params.driver_id });
  successResponse(res, result);
});

const applyStandingAction = catchAsync(async (req, res) => {
  const result = await adminDashboardService.applyStandingAction(
    req.user.id,
    req.params.driver_id,
    req.body.action,
    req.body.reason
  );
  auditService.track({
    action: `dashboard.account_action.${req.body.action}`,
    resourceType: 'driver',
    resourceId: req.params.driver_id,
    actorId: req.user.id,
    payload: { action: req.body.action, reason: req.body.reason || null },
  });
  markResource(res, { type: 'driver', id: req.params.driver_id });
  successResponse(res, result);
});

const approveDocument = catchAsync(async (req, res) => {
  const result = await adminDashboardService.decideDocument(
    req.user.id,
    req.params.driver_id,
    req.params.document_key,
    'approved',
    null
  );
  auditService.track({
    action: 'dashboard.document.approve',
    resourceType: 'document_review',
    resourceId: `${req.params.driver_id}:${req.params.document_key}`,
    actorId: req.user.id,
    payload: { document_key: req.params.document_key },
  });
  markResource(res, { type: 'document_review', id: `${req.params.driver_id}:${req.params.document_key}` });
  successResponse(res, result);
});

const rejectDocument = catchAsync(async (req, res) => {
  const result = await adminDashboardService.decideDocument(
    req.user.id,
    req.params.driver_id,
    req.params.document_key,
    'rejected',
    req.body.reason
  );
  auditService.track({
    action: 'dashboard.document.reject',
    resourceType: 'document_review',
    resourceId: `${req.params.driver_id}:${req.params.document_key}`,
    actorId: req.user.id,
    payload: { document_key: req.params.document_key, reason: req.body.reason || null },
  });
  markResource(res, { type: 'document_review', id: `${req.params.driver_id}:${req.params.document_key}` });
  successResponse(res, result);
});

// ===== US5: Shared listings =====

const listReservations = catchAsync(async (req, res) => {
  const result = await adminDashboardService.listReservations(req.query);
  successResponse(res, result);
});

module.exports = {
  getSummary,
  getRecentTrips,
  getTopRoutes,
  getPendingRequests,
  getLatestComplaints,
  listDrivers,
  getDriverStats,
  getDriverHeader,
  getDriverOverview,
  listDriverTrips,
  getDriverEvaluations,
  getAccountLog,
  getCarDetails,
  getDocuments,
  setDriverStatus,
  applyStandingAction,
  approveDocument,
  rejectDocument,
  listReservations,
};
