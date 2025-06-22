import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateFormatDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
} 