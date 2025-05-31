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
    school_type: string;

    @IsNotEmpty()
    @IsString()
    school_ownership: string;
}

enum SchoolType {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    PRIMARY_SECONDARY = "primary_secondary",
    OTHER = "other"
}
enum SchoolOwnership {
    GOVERNMENT_OWNED = "government",
    PRIVATE = "private",
    OTHER = "other"
}