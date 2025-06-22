import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateGenreDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
} 