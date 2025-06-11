import { IsNotEmpty, IsString, IsArray } from "class-validator";
import { string } from "joi";

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
export class RequestLoginOtpDTO {
    @IsNotEmpty()
    @IsString()
    email: string
}

export class VerifyEmailOTPDto {
    @IsString()
    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    @IsString()
    otp: string
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

export class OnboardClassesDto {
    @IsNotEmpty({ message: 'Class names array cannot be empty' })
    @IsArray({ message: 'Class names must be an array' })
    @IsString({ each: true, message: 'Each class name must be a string' })
    class_names: string[];
}

export class TeacherDto {
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    first_name: string;

    @IsNotEmpty({ message: 'Last name is required' })
    @IsString({ message: 'Last name must be a string' })
    last_name: string;

    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;

    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString({ message: 'Phone number must be a string' })
    phone_number: string;
}

export class OnboardTeachersDto {
    @IsNotEmpty({ message: 'Teachers array cannot be empty' })
    @IsArray({ message: 'Teachers must be an array' })
    teachers: TeacherDto[];
}

export class StudentDto {
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    first_name: string;

    @IsNotEmpty({ message: 'Last name is required' })
    @IsString({ message: 'Last name must be a string' })
    last_name: string;

    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;

    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString({ message: 'Phone number must be a string' })
    phone_number: string;

    @IsNotEmpty({ message: 'Default class is required' })
    @IsString({ message: 'Default class must be a string' })
    default_class: string;
}

export class OnboardStudentsDto {
    @IsNotEmpty({ message: 'Students array cannot be empty' })
    @IsArray({ message: 'Students must be an array' })
    students: StudentDto[];
}

export class DirectorDto {
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    first_name: string;

    @IsNotEmpty({ message: 'Last name is required' })
    @IsString({ message: 'Last name must be a string' })
    last_name: string;

    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;

    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString({ message: 'Phone number must be a string' })
    phone_number: string;
}

export class OnboardDirectorsDto {
    @IsNotEmpty({ message: 'Directors array cannot be empty' })
    @IsArray({ message: 'Directors must be an array' })
    directors: DirectorDto[];
}

export class OnboardDataDto {
    @IsArray({ message: 'Class names must be an array' })
    @IsString({ each: true, message: 'Each class name must be a string' })
    class_names?: string[];

    @IsArray({ message: 'Teachers must be an array' })
    teachers?: TeacherDto[];

    @IsArray({ message: 'Students must be an array' })
    students?: StudentDto[];

    @IsArray({ message: 'Directors must be an array' })
    directors?: DirectorDto[];
}