import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateAffiliateLinkDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}  