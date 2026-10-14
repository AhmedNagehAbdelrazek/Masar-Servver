var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, Validate, ValidatorConstraint, } from 'class-validator';
let NonEmptyTagsRule = class NonEmptyTagsRule {
    validate(value) {
        return (Array.isArray(value) &&
            value.every((item) => typeof item === 'string' && item.trim().length > 0));
    }
    defaultMessage() {
        return 'each tag must be a non-empty string';
    }
};
NonEmptyTagsRule = __decorate([
    ValidatorConstraint({ name: 'nonEmptyTags', async: false })
], NonEmptyTagsRule);
export class CreateRatingDto {
    booking_id;
    stars;
    was_late;
    late_minutes;
    review;
    tags;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateRatingDto.prototype, "booking_id", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(5),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateRatingDto.prototype, "stars", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateRatingDto.prototype, "was_late", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateRatingDto.prototype, "late_minutes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], CreateRatingDto.prototype, "review", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    Validate(NonEmptyTagsRule),
    __metadata("design:type", Array)
], CreateRatingDto.prototype, "tags", void 0);
//# sourceMappingURL=create-rating.dto.js.map