export declare class OnboardingProfileDto {
    fullName: string;
    age: number;
    gender: 'male' | 'female';
    userIdentificationFront: number;
    userIdentificationBack: number;
    linceseFront: number;
    linceseBack: number;
    personalImageWithId: number;
    nationalID: string;
}
export declare class OnboardingPassengerProfileDto {
    fullname: string;
    national_id: string;
    age: number;
    home_address: string;
    gender: 'male' | 'female';
}
export declare class OnboardingVehicleDto {
    vehicleType: string;
    manufacturer: string;
    model: string;
    modelYear?: number;
    color?: string;
    plateNumber: string;
    codeNumber?: string;
    seats: number;
    registrationDocFront: number;
    registrationDocBack: number;
    vehiclePhotoFront: number;
    vehiclePhotoBack: number;
}
