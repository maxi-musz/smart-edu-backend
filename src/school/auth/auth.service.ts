import { Injectable } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { SchoolOwnership, SchoolType } from '@prisma/client';

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService) {}
    
    // Onboard new school
    async onboardSchool(payload: any) {

        console.log(colors.blue('Onboarding a new school...'));
        // console.log("payload: ", payload);

        try {

            

            // create a new school in the database
            const new_school = await this.prisma.school.create({
                data: {
                    school_name: payload.school_name,
                    school_email: payload.school_email,
                    school_address: payload.school_address,
                    school_phone: payload.school_phone,
                    school_type: payload.school_type,
                    school_ownership: payload.school_ownership,
                }
            })

            // return the newly created school
            console.log(colors.magenta("New school created successfully!"));
            return ResponseHelper.success(
                "New school created successfully!",
                new_school
            )
            
        } catch (error) {
            console.log(colors.red("Error creating new school: "), error);
            return ResponseHelper.error(
                "Error creating new school",
                error
            );
        }
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

// generate a hashed password
            // const hashedPassword = await argon.hash(payload.password);
