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
import { ResolveSosDto, SosIdParam, SosListQuery } from './dto/sos.query.js';
import { SosService } from './sos.service.js';
let SosController = class SosController {
    sos;
    constructor(sos) {
        this.sos = sos;
    }
    listSos(query, user) {
        return this.sos.listAdmin({ id: user?.id ?? '', role: user?.role ?? 'admin' }, {
            status: query.status,
            page: query.page,
            limit: query.limit,
        });
    }
    ackSos(params, user) {
        return this.sos.acknowledge({ id: user?.id ?? '', role: user?.role ?? '' }, params.id);
    }
    resolveSos(params, dto, user) {
        return this.sos.resolve({ id: user?.id ?? '', role: user?.role ?? '' }, params.id, dto.resolution_note);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SosListQuery, Object]),
    __metadata("design:returntype", Promise)
], SosController.prototype, "listSos", null);
__decorate([
    Post(':id/ack'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SosIdParam, Object]),
    __metadata("design:returntype", Promise)
], SosController.prototype, "ackSos", null);
__decorate([
    Post(':id/resolve'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SosIdParam,
        ResolveSosDto, Object]),
    __metadata("design:returntype", Promise)
], SosController.prototype, "resolveSos", null);
SosController = __decorate([
    Controller('admin/sos'),
    Roles('admin'),
    __metadata("design:paramtypes", [SosService])
], SosController);
export { SosController };
//# sourceMappingURL=sos.controller.js.map