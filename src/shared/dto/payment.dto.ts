import { IsArray, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PaymentItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class PaymentDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items: PaymentItemDto[];

  @IsNumber()
  paymentPercent: number;

  @IsNumber()
  payNow: number;

  @IsNumber()
  payLater: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  email?: string;
} 