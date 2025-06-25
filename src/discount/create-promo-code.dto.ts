import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  discountPercent: number;

  @IsOptional()
  @IsString()
  productId?: string;
} 