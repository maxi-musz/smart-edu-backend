import { IsNotEmpty, IsString } from "class-validator";

export class requestAffiliatePermissionDto {
    @IsNotEmpty()
    @IsString()
    niche: string;

    @IsNotEmpty()
    @IsString()
    reason: string;
}