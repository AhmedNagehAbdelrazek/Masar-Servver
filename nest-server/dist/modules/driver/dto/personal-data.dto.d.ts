declare class PersonalDataVehicleDto {
    manufacturer?: string;
    model?: string;
    model_year?: number;
    color?: string;
    plate_number?: string;
    total_seats?: number;
}
export declare class UpdatePersonalDataDto {
    full_name?: string;
    display_name?: string | null;
    email?: string | null;
    phone?: string;
    age?: number | null;
    avatar_url?: string | null;
    national_id?: string;
    vehicle?: PersonalDataVehicleDto;
}
export {};
