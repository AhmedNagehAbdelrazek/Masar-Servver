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
import { ArrayMinSize, IsArray, IsBoolean, IsDefined, IsIn, IsNotEmpty, IsOptional, Validate, ValidateNested, ValidatorConstraint, } from 'class-validator';
import { ALL_NOTIFICATION_TYPES } from '../notification.constants.js';
let ExclusiveMasterSwitchRule = class ExclusiveMasterSwitchRule {
    validate(value, args) {
        const obj = args.object;
        if (value !== undefined && obj.updates !== undefined)
            return false;
        return true;
    }
    defaultMessage() {
        return 'send either master_switch or updates, not both';
    }
};
ExclusiveMasterSwitchRule = __decorate([
    ValidatorConstraint({ name: 'exclusiveMasterSwitch', async: false })
], ExclusiveMasterSwitchRule);
class GroupedUpdateItemDto {
    type;
    channel;
    enabled;
}
__decorate([
    IsNotEmpty(),
    IsIn([...ALL_NOTIFICATION_TYPES]),
    __metadata("design:type", String)
], GroupedUpdateItemDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsIn(['in_app', 'push']),
    __metadata("design:type", String)
], GroupedUpdateItemDto.prototype, "channel", void 0);
__decorate([
    IsDefined(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], GroupedUpdateItemDto.prototype, "enabled", void 0);
export class GroupedSettingsDto {
    master_switch;
    updates;
}
__decorate([
    IsOptional(),
    IsBoolean(),
    Validate(ExclusiveMasterSwitchRule),
    __metadata("design:type", Boolean)
], GroupedSettingsDto.prototype, "master_switch", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => GroupedUpdateItemDto),
    __metadata("design:type", Array)
], GroupedSettingsDto.prototype, "updates", void 0);
//# sourceMappingURL=grouped-settings.dto.js.map