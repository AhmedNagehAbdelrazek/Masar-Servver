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
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ComplaintsService } from './complaints.service.js';
import { CreateComplaintDto } from './dto/create-complaint.dto.js';
let ComplaintsController = class ComplaintsController {
    complaints;
    constructor(complaints) {
        this.complaints = complaints;
    }
    createComplaint(dto, user) {
        return this.complaints.create(user?.id ?? '', dto);
    }
};
__decorate([
    Post(),
    HttpCode(200),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateComplaintDto, Object]),
    __metadata("design:returntype", Promise)
], ComplaintsController.prototype, "createComplaint", null);
ComplaintsController = __decorate([
    Controller('complaints'),
    __metadata("design:paramtypes", [ComplaintsService])
], ComplaintsController);
export { ComplaintsController };
//# sourceMappingURL=complaints.controller.js.map