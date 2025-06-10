import { IsNotEmpty, IsString } from "class-validator";

export class OnboardSchoolDto {
    @IsNotEmpty()
    @IsString()
    school_name: string;

    @IsNotEmpty()
    @IsString()
    school_email: string;

    @IsNotEmpty()
    @IsString()
    school_address: string;

    @IsNotEmpty()
    @IsString()
    school_phone: string;

    @IsNotEmpty()
    @IsString()
    school_type: SchoolType;

    @IsNotEmpty()
    @IsString()
    school_ownership: SchoolOwnership;
}

enum SchoolType {
    primary = "primary",
    secondary = "secondary",
    primary_and_secondary = "primary_and_secondary",
    other = "other"
}
enum SchoolOwnership {
    GOVERNMENT_OWNED = "government",
    PRIVATE = "private",
    OTHER = "other"
}

export class SignInDto {
    @IsNotEmpty()
    @IsString()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}

export class RequestPasswordResetDTO {
    @IsNotEmpty()
    @IsString()
    email: string
}

export class VerifyresetOtp {
    @IsString()
    @IsNotEmpty()
    otp: string

    @IsString()
    @IsNotEmpty()
    email: string
}

export class ResetPasswordDTO {
    @IsString()
    @IsNotEmpty()
    new_password: string
    
    @IsString()
    @IsNotEmpty()
    confirm_password: string

    @IsString()
    @IsNotEmpty()
    email: string

}