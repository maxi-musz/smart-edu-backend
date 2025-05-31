import { Injectable } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService) {}
    
    // Onboard new school
    async onboardSchool(payload: any) {

        console.log(colors.blue('Onboarding a new school...'));

        try {

            console.log(colors.green(`new school data: ${JSON.stringify({ data: payload })}`));
            
        } catch (error) {
            
        }
        
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
