import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
} 