import { type ValidationOptions } from 'class-validator';
export declare function IsLat(options?: ValidationOptions): PropertyDecorator;
export declare function IsLng(options?: ValidationOptions): PropertyDecorator;
export declare function IsMoney(options?: ValidationOptions): PropertyDecorator;
export declare function HasTimezone(options?: ValidationOptions): PropertyDecorator;
export declare function TrimString(): PropertyDecorator;
