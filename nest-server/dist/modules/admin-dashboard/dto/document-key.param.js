var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
export class DocumentDecisionParams {
    driver_id;
    document_key;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], DocumentDecisionParams.prototype, "driver_id", void 0);
__decorate([
    IsString(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    MinLength(2),
    MaxLength(40),
    __metadata("design:type", String)
], DocumentDecisionParams.prototype, "document_key", void 0);
//# sourceMappingURL=document-key.param.js.map