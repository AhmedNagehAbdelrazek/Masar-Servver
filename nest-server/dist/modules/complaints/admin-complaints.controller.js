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
import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ComplaintsService } from './complaints.service.js';
import { AdminComplaintListQuery } from './dto/complaint-list.query.js';
import { ComplaintPenaltyDto } from './dto/complaint-penalty.dto.js';
import { ComplaintIdParam, ResolveComplaintDto } from './dto/resolve-complaint.dto.js';
let AdminComplaintsController = class AdminComplaintsController {
    complaints;
    constructor(complaints) {
        this.complaints = complaints;
    }
    getStats() {
        return this.complaints.getStats();
    }
    listComplaints(query) {
        return this.complaints.listAdmin(query);
    }
    getDetail(params) {
        return this.complaints.getDetail(params.complaint_id);
    }
    penalize(params, dto, user) {
        return this.complaints.penalize(user?.id ?? '', params.complaint_id, dto);
    }
    resolveComplaint(params, dto, user) {
        return this.complaints.resolve(user?.id ?? '', params.complaint_id, dto);
    }
};
__decorate([
    Get('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminComplaintsController.prototype, "getStats", null);
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminComplaintListQuery]),
    __metadata("design:returntype", Promise)
], AdminComplaintsController.prototype, "listComplaints", null);
__decorate([
    Get(':complaint_id'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ComplaintIdParam]),
    __metadata("design:returntype", Promise)
], AdminComplaintsController.prototype, "getDetail", null);
__decorate([
    Post(':complaint_id/penalties'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ComplaintIdParam,
        ComplaintPenaltyDto, Object]),
    __metadata("design:returntype", Promise)
], AdminComplaintsController.prototype, "penalize", null);
__decorate([
    Put(':complaint_id'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ComplaintIdParam,
        ResolveComplaintDto, Object]),
    __metadata("design:returntype", Promise)
], AdminComplaintsController.prototype, "resolveComplaint", null);
AdminComplaintsController = __decorate([
    Controller('admin/complaints'),
    Roles('admin'),
    __metadata("design:paramtypes", [ComplaintsService])
], AdminComplaintsController);
export { AdminComplaintsController };
//# sourceMappingURL=admin-complaints.controller.js.map