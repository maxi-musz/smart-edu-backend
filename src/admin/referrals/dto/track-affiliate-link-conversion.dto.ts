import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class TrackAffiliateLinkConversionDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsNumber()
  commissionAmount?: number;
} 