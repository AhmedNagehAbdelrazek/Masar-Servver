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
import { ArrayMinSize, IsArray, IsBoolean, IsDefined, IsIn, IsNotEmpty, IsOptional, ValidateNested, } from 'class-validator';
import { ALL_NOTIFICATION_TYPES } from '../notification.constants.js';
class SettingItemDto {
    type;
    enabled_in_app;
    enabled_push;
}
__decorate([
    IsNotEmpty(),
    IsIn([...ALL_NOTIFICATION_TYPES]),
    __metadata("design:type", String)
], SettingItemDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], SettingItemDto.prototype, "enabled_in_app", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], SettingItemDto.prototype, "enabled_push", void 0);
export class UpdateSettingsDto {
    settings;
}
__decorate([
    IsDefined(),
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => SettingItemDto),
    __metadata("design:type", Array)
], UpdateSettingsDto.prototype, "settings", void 0);
//# sourceMappingURL=update-settings.dto.js.map