import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OnboardSchoolDto, SignInDto } from 'src/shared/dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('onboard-school')
    onboardSchool(@Body() dto: OnboardSchoolDto) {
        return this.authService.onboardSchool(dto);
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
 