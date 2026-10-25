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
import { AcceptRideRequestBody, CreateOfferDto, CreateRideRequestDto, ListRideRequestsQuery, RequestIdParam, UpdateRideRequestDto, } from './dto/ride-request.dto.js';
import { RideRequestsService } from './ride-requests.service.js';
let RideRequestsController = class RideRequestsController {
    requests;
    constructor(requests) {
        this.requests = requests;
    }
    createRideRequest(dto, user) {
        return this.requests
            .createRideRequest(user?.id ?? '', dto)
            .then((ride_request) => ({ ride_request }));
    }
    listRequests(query, user) {
        return this.requests.listRequests({ id: user?.id ?? '', role: user?.role ?? '' }, query);
    }
    getRequest(requestId, user) {
        return this.requests.getRequest({ id: user?.id ?? '', role: user?.role ?? '' }, requestId);
    }
    getMatches(requestId, user) {
        return this.requests.getMatches({ id: user?.id ?? '', role: user?.role ?? '' }, requestId);
    }
    updateRideRequest(params, dto, user) {
        return this.requests
            .updateRideRequest(user?.id ?? '', params.request_id, dto)
            .then((result) => result);
    }
    submitOffer(params, dto, user) {
        return this.requests
            .submitOffer(user?.id ?? '', params.request_id, dto)
            .then((offer) => ({ offer }));
    }
    listOffers(requestId, user) {
        return this.requests.listOffersForRequest(user?.id ?? '', requestId);
    }
    acceptRideRequest(params, dto, user) {
        return this.requests.acceptRideRequest(user?.id ?? '', params.request_id, dto);
    }
};
__decorate([
    Post(),
    HttpCode(201),
    Roles('passenger'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateRideRequestDto, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "createRideRequest", null);
__decorate([
    Get(),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListRideRequestsQuery, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "listRequests", null);
__decorate([
    Get(':request_id'),
    __param(0, Param('request_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "getRequest", null);
__decorate([
    Get(':request_id/matches'),
    Roles('passenger'),
    __param(0, Param('request_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "getMatches", null);
__decorate([
    Put(':request_id'),
    Roles('passenger'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RequestIdParam,
        UpdateRideRequestDto, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "updateRideRequest", null);
__decorate([
    Post(':request_id/offers'),
    HttpCode(201),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RequestIdParam,
        CreateOfferDto, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "submitOffer", null);
__decorate([
    Get(':request_id/offers'),
    __param(0, Param('request_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "listOffers", null);
__decorate([
    Post(':request_id/accept'),
    HttpCode(201),
    Roles('driver'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RequestIdParam,
        AcceptRideRequestBody, Object]),
    __metadata("design:returntype", Promise)
], RideRequestsController.prototype, "acceptRideRequest", null);
RideRequestsController = __decorate([
    Controller('ride-requests'),
    __metadata("design:paramtypes", [RideRequestsService])
], RideRequestsController);
export { RideRequestsController };
//# sourceMappingURL=ride-requests.controller.js.map