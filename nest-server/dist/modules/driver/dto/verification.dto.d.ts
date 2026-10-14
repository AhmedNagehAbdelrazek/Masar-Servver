declare class VerificationVehicleDto {
    manufacturer: string;
    model: string;
    vehicle_type: string;
    model_year?: number;
    plate_number: string;
    code_number?: string;
    color?: string;
    seats: number;
    registration_doc_front?: number;
    registration_doc_back?: number;
    vehicle_photo_front?: number;
    vehicle_photo_back?: number;
}
export declare class SubmitVerificationDto {
    full_name?: string;
    national_id?: string;
    license_number?: string;
    license_expiry?: string;
    phone?: unknown;
    user_identification_front?: number;
    user_identification_back?: number;
    lincese_front?: number;
    lincese_back?: number;
    personal_image_with_id?: number;
    vehicle: VerificationVehicleDto;
}
export declare class VerificationQueueQuery {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare const VERIFICATION_FIELD_KEYS: readonly ["national_id", "license", "personal_photo", "vehicle_registration", "vehicle_photo", "vehicle_details", "personal_details"];
export declare class RejectVerificationDto {
    reason: string;
    fields_to_fix: string[];
}
export declare class DriverIdParam {
    driver_id: string;
}
export declare class VehicleIdParam {
    vehicle_id: string;
}
export {};
