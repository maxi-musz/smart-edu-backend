import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateLanguageDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
} 