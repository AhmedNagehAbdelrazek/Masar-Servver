var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AccountActionDto, RejectDocumentDto, SetDriverStatusDto } from './dto/admin-actions.dto.js';
import { DriversListQuery, DriverTripsQuery, RecentTripsQuery, ReservationsQuery, } from './dto/dashboard-queries.dto.js';
import { DocumentDecisionParams } from './dto/document-key.param.js';
import { DriverIdParam } from './dto/driver-id.param.js';
let AdminDashboardController = class AdminDashboardController {
    dashboard;
    constructor(dashboard) {
        this.dashboard = dashboard;
    }
    getSummary() {
        return this.dashboard.getSummary();
    }
    getRecentTrips(query) {
        return this.dashboard.getRecentTrips(query);
    }
    getTopRoutes() {
        return this.dashboard.getTopRoutes();
    }
    getPendingRequests(query) {
        return this.dashboard.getPendingRequests(query);
    }
    getLatestComplaints(query) {
        return this.dashboard.getLatestComplaints(query);
    }
    listDrivers(query) {
        return this.dashboard.listDrivers(query);
    }
    getDriverStats() {
        return this.dashboard.getDriverStats();
    }
    getDriverHeader(params) {
        return this.dashboard.getDriverHeader(params.driver_id);
    }
    getDriverOverview(params) {
        return this.dashboard.getDriverOverview(params.driver_id);
    }
    listDriverTrips(params, query) {
        return this.dashboard.listDriverTrips(params.driver_id, query);
    }
    getDriverEvaluations(params, query) {
        return this.dashboard.getDriverEvaluations(params.driver_id, query);
    }
    getAccountLog(params) {
        return this.dashboard.getAccountLog(params.driver_id);
    }
    getCarDetails(params) {
        return this.dashboard.getCarDetails(params.driver_id);
    }
    getDocuments(params) {
        return this.dashboard.getDocuments(params.driver_id);
    }
    setDriverStatus(params, dto, user) {
        return this.dashboard.setDriverStatus(user?.id ?? '', params.driver_id, dto.status);
    }
    applyStandingAction(params, dto, user) {
        return this.dashboard.applyStandingAction(user?.id ?? '', params.driver_id, dto.action, dto.reason);
    }
    approveDocument(params, user) {
        return this.dashboard.decideDocument(user?.id ?? '', params.driver_id, params.document_key, 'approved', null);
    }
    rejectDocument(params, dto, user) {
        return this.dashboard.decideDocument(user?.id ?? '', params.driver_id, params.document_key, 'rejected', dto.reason);
    }
    listReservations(query) {
        return this.dashboard.listReservations(query);
    }
};
__decorate([
    Get('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getSummary", null);
__decorate([
    Get('recent-trips'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RecentTripsQuery]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getRecentTrips", null);
__decorate([
    Get('top-routes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getTopRoutes", null);
__decorate([
    Get('pending-requests'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RecentTripsQuery]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getPendingRequests", null);
__decorate([
    Get('latest-complaints'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RecentTripsQuery]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getLatestComplaints", null);
__decorate([
    Get('drivers'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriversListQuery]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "listDrivers", null);
__decorate([
    Get('drivers/stats/summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getDriverStats", null);
__decorate([
    Get('drivers/:driver_id'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getDriverHeader", null);
__decorate([
    Get('drivers/:driver_id/overview'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getDriverOverview", null);
__decorate([
    Get('drivers/:driver_id/trips'),
    __param(0, Param()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam,
        DriverTripsQuery]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "listDriverTrips", null);
__decorate([
    Get('drivers/:driver_id/evaluations'),
    __param(0, Param()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam,
        RecentTripsQuery]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getDriverEvaluations", null);
__decorate([
    Get('drivers/:driver_id/account-log'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getAccountLog", null);
__decorate([
    Get('drivers/:driver_id/car'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getCarDetails", null);
__decorate([
    Get('drivers/:driver_id/documents'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getDocuments", null);
__decorate([
    Post('drivers/:driver_id/status'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam,
        SetDriverStatusDto, Object]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "setDriverStatus", null);
__decorate([
    Post('drivers/:driver_id/account-status'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam,
        AccountActionDto, Object]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "applyStandingAction", null);
__decorate([
    Post('drivers/:driver_id/documents/:document_key/approve'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DocumentDecisionParams, Object]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "approveDocument", null);
__decorate([
    Post('drivers/:driver_id/documents/:document_key/reject'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DocumentDecisionParams,
        RejectDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "rejectDocument", null);
__decorate([
    Get('reservations'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReservationsQuery]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "listReservations", null);
AdminDashboardController = __decorate([
    Controller('admin/dashboard'),
    Roles('admin'),
    __metadata("design:paramtypes", [AdminDashboardService])
], AdminDashboardController);
export { AdminDashboardController };
//# sourceMappingURL=admin-dashboard.controller.js.map