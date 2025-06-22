import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAgeRatingDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
} 