import { IsOptional, IsString, IsNumber, IsIn, Min, Max, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetProductsDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsIn(['active', 'inactive', 'suspended'])
    status?: string;

    @IsOptional()
    @IsString()
    format?: string;

    @IsOptional()
    @IsString()
    publisher?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    inStock?: boolean;

    @IsOptional()
    @IsIn(['name', 'price', 'stock', 'createdAt', 'author', 'publisher'])
    sortBy?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
} 