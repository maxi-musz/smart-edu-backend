import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class IssueCommisionDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(3)
    commission: string
}