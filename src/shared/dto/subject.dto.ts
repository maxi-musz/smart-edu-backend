import { IsString, IsNotEmpty, IsOptional, IsHexColor } from "class-validator";

export class CreateSubjectDto {
    @IsString()
    @IsNotEmpty()
    subject_name: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    class_taking_it?: string;

    @IsString()
    @IsOptional()
    teacher_taking_it?: string;

    @IsString()
    @IsHexColor()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class EditSubjectDto {
    @IsString()
    @IsNotEmpty()
    subject_name: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    class_taking_it?: string;

    @IsString()
    @IsOptional()
    teacher_taking_it?: string;

    @IsString()
    @IsHexColor()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    description?: string;
}