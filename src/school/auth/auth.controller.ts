import { Body, Controller, Post, UseInterceptors, UploadedFiles, Get } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { OnboardSchoolDto, SignInDto } from 'src/shared/dto/auth.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('test-upload')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cac_or_approval_letter', maxCount: 1 },
            { name: 'utility_bill', maxCount: 1 },
            { name: 'tax_cert', maxCount: 1 }
        ]),
        FileValidationInterceptor
    )
    testUpload(
        @Body() body: any,
        @UploadedFiles() files: {
            cac_or_approval_letter?: Express.Multer.File[],
            utility_bill?: Express.Multer.File[],
            tax_cert?: Express.Multer.File[]
        }
    ) {
        console.log('Body:', body);
        console.log('Files:', files);
        
        return {
            message: 'Files received successfully',
            body,
            files: {
                cac: files.cac_or_approval_letter?.[0]?.originalname,
                utility: files.utility_bill?.[0]?.originalname,
                tax: files.tax_cert?.[0]?.originalname
            }
        };
    }

    @Post('onboard-school')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cac_or_approval_letter', maxCount: 1 },
            { name: 'utility_bill', maxCount: 1 },
            { name: 'tax_cert', maxCount: 1 }
        ]),
        FileValidationInterceptor
    )
    onboardSchool(
        @Body() dto: OnboardSchoolDto,
        @UploadedFiles() files: {
            cac_or_approval_letter?: Express.Multer.File[],
            utility_bill?: Express.Multer.File[],
            tax_cert?: Express.Multer.File[]
        }
    ) {
        const fileArray = [
            files.cac_or_approval_letter?.[0],
            files.utility_bill?.[0],
            files.tax_cert?.[0]
        ].filter((file): file is Express.Multer.File => file !== undefined);

        return this.authService.onboardSchool(dto, fileArray);
    }

    @Post('director-login-otp')
    signUp() {}

    @Post("director-verify-login-otp")
    verifyOTP() {}

    @Post("sign-in")
    signIn(@Body() dto: SignInDto) {
        return this.authService.signIn(dto);
    }
}
 