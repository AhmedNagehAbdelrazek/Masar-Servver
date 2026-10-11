var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
export class SosListQuery {
    status;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], SosListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], SosListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], SosListQuery.prototype, "limit", void 0);
export class SosIdParam {
    id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], SosIdParam.prototype, "id", void 0);
export class ResolveSosDto {
    resolution_note;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], ResolveSosDto.prototype, "resolution_note", void 0);
//# sourceMappingURL=sos.query.js.map