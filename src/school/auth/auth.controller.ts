import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('onboard-school')
    onboardSchool() {

        return this.authService.onboardSchool();
    }

    @Post('director-login-otp')
    signUp() {}

    @Post("director-verify-login-otp")
    verifyOTP() {}

    @Post("sign-in")
    signIn() {}
}
 