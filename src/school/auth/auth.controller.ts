import { Body, Controller, Post, UseInterceptors, UploadedFiles, Get, HttpCode, UseGuards, Request } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { OnboardSchoolDto, RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, VerifyresetOtp, OnboardClassesDto, OnboardTeachersDto, OnboardStudentsDto, OnboardDirectorsDto, OnboardDataDto, RequestLoginOtpDTO, VerifyEmailOTPDto } from 'src/shared/dto/auth.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';

import { JwtGuard } from './guard';

interface ErrorResponse {
    success: false;
    message: string;
    error: any;
    statusCode: number;
}

interface SuccessResponse {
    success: true;
    message: string;
    data: any;
    length?: number;
    meta?: any;
    statusCode: number;
}

type ApiResponse = ErrorResponse | SuccessResponse;

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('onboard-school')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cac_or_approval_letter', maxCount: 1 },
            { name: 'utility_bill', maxCount: 1 },
            { name: 'tax_cert', maxCount: 1 }
        ]),
        FileValidationInterceptor
    )
    async onboardSchool(
        @Body() dto: OnboardSchoolDto,
        @UploadedFiles() files: {
            cac_or_approval_letter?: Express.Multer.File[],
            utility_bill?: Express.Multer.File[],
            tax_cert?: Express.Multer.File[]
        }
    ): Promise<ApiResponse> {
        const fileArray = [
            files.cac_or_approval_letter?.[0],
            files.utility_bill?.[0],
            files.tax_cert?.[0]
        ].filter((file): file is Express.Multer.File => file !== undefined);

        return this.authService.onboardSchool(dto, fileArray) as Promise<ApiResponse>;
    }

    @Post('director-login-otp')
    signUp(@Body() dto: RequestLoginOtpDTO) {
        return this.authService.directorRequestLoginOtp(dto)
    }

    @Post("director-verify-login-otp")
    verifyEmailOTPAndSignIn(@Body() dto: VerifyEmailOTPDto) {
        return this.authService.verifyEmailOTPAndSignIn(dto)
    }

    @Post("sign-in")
    @HttpCode(200)
    signIn(@Body() dto: SignInDto) {
        return this.authService.signIn(dto);
    }

    @Post("request-password-reset-otp")
    @HttpCode(200)
    requestPasswordResetOTP(@Body() dto: RequestPasswordResetDTO) {
        return this.authService.requestPasswordResetOTP(dto)
    }

    @Post("verify-password-reset-otp")
    @HttpCode(200)
    verifyResetPasswordOTP(@Body() dto: VerifyresetOtp) {
        return this.authService.verifyResetPasswordOTP(dto)
    }

    @Post("reset-password")
    @HttpCode(200)
    resetPassword(@Body() dto: ResetPasswordDTO) {
        return this.authService.resetPassword(dto)
    }

    @UseGuards(JwtGuard)
    @Post("onboard-classes")
    @HttpCode(201)
    onboardClasses(@Body() dto: OnboardClassesDto, @Request() req: any) {
        return this.authService.onboardClasses(dto, req.user);
    }

    @UseGuards(JwtGuard)
    @Post("onboard-teachers")
    @HttpCode(201)
    onboardTeachers(@Body() dto: OnboardTeachersDto, @Request() req: any) {
        return this.authService.onboardTeachers(dto, req.user);
    }

    @UseGuards(JwtGuard)
    @Post("onboard-students")
    @HttpCode(201)
    onboardStudents(@Body() dto: OnboardStudentsDto, @Request() req: any) {
        return this.authService.onboardStudents(dto, req.user);
    }

    @UseGuards(JwtGuard)
    @Post("onboard-directors")
    @HttpCode(201)
    onboardDirectors(@Body() dto: OnboardDirectorsDto, @Request() req: any) {
        return this.authService.onboardDirectors(dto, req.user);
    }

    @UseGuards(JwtGuard)
    @Post("onboard-data")
    @HttpCode(201)
    onboardData(@Body() dto: OnboardDataDto, @Request() req: any) {
        return this.authService.onboardData(dto, req.user);
    }
}
 