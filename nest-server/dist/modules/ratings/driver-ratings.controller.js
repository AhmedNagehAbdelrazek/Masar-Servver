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
import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RatingListQuery } from './dto/rating-list.query.js';
import { RatingsService } from './ratings.service.js';
let DriverRatingsController = class DriverRatingsController {
    ratings;
    constructor(ratings) {
        this.ratings = ratings;
    }
    getRatings(query, user) {
        return this.ratings.listWithDistribution(user?.id ?? '', query);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RatingListQuery, Object]),
    __metadata("design:returntype", Promise)
], DriverRatingsController.prototype, "getRatings", null);
DriverRatingsController = __decorate([
    Controller('driver/ratings'),
    Roles('driver'),
    __metadata("design:paramtypes", [RatingsService])
], DriverRatingsController);
export { DriverRatingsController };
//# sourceMappingURL=driver-ratings.controller.js.map