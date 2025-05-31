import { Injectable } from '@nestjs/common';
import * as colors from 'colors';

@Injectable()
export class AuthService {
    
    // Onboard new school
    async onboardSchool() {

        console.log(colors.blue('Onboarding a new school...'));
        
        console.log(colors.magenta("Successfully onboarded a new school!"));
        
        return "Successfully onboarded a new school!";
    }

    // Direcotr login with OTP
    async directorLoginOtp() {
        return "Director login OTP";
    }

    // Verify director login OTP
    async verifyDirectorLoginOtp() {
        
        return "Director login OTP verified";
    }


}
