import { Injectable } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { SchoolOwnership, SchoolType } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { SignInDto } from 'src/shared/dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
// import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private readonly cloudinaryService: CloudinaryService
    ) {}
    
    // Onboard new school
    async onboardSchool(payload: any, files: Express.Multer.File[]) {

        console.log(colors.blue('Onboarding a new school...'));
        // console.log("payload: ", payload);

        const defaultPassword = `${payload.school_name.slice(0, 3).toLowerCase().replace(/\s+/g, '')}/sm/${payload.school_phone.slice(-4)}`;
        // console.log(colors.yellow("Default password: "), defaultPassword);

        const uploadedFiles = await this.cloudinaryService.uploadToCloudinary(files);

        try {

            // hash the password 
            const hashedPassword = await argon.hash(defaultPassword);
            console.log(colors.green("Hashed password: "), hashedPassword);

            // create a new school in the database
            const new_school = await this.prisma.school.create({
                data: {
                    school_name: payload.school_name.toLowerCase(),
                    school_email: payload.school_email.toLowerCase(),
                    school_address: payload.school_address.toLowerCase(),
                    school_phone: payload.school_phone,
                    school_type: payload.school_type.toLowerCase() as SchoolType,
                    school_ownership: payload.school_ownership.toLowerCase() as SchoolOwnership,
                    // Create and connect documents
                    cac: uploadedFiles[0] ? {
                        create: {
                            secure_url: uploadedFiles[0].secure_url,
                            public_id: uploadedFiles[0].public_id
                        }
                    } : undefined,
                    utility_bill: uploadedFiles[1] ? {
                        create: {
                            secure_url: uploadedFiles[1].secure_url,
                            public_id: uploadedFiles[1].public_id
                        }
                    } : undefined,
                    tax_clearance: uploadedFiles[2] ? {
                        create: {
                            secure_url: uploadedFiles[2].secure_url,
                            public_id: uploadedFiles[2].public_id
                        }
                    } : undefined,
                }
            });

            // create new user also with email and hashed password
            await this.prisma.user.create({
                data: {
                    email: payload.school_email.toLowerCase(),
                    password: hashedPassword,
                    role: "school_director", 
                    school_id: new_school.id, 
                }
            });

            const formatted_response = {
                id: new_school.id,
                school_name: new_school.school_name,
                school_email: new_school.school_email,
                school_address: new_school.school_address,
                documents: {
                    cac: uploadedFiles[0]?.secure_url || null,
                    utility_bill: uploadedFiles[1]?.secure_url || null,
                    tax_clearance: uploadedFiles[2]?.secure_url || null,
                },
                created_at: formatDate(new_school.createdAt),
                updated_at: formatDate(new_school.updatedAt),
            };

            // return the newly created school
            console.log(colors.magenta("New school created successfully!"));
            return ResponseHelper.success(
                "New school created successfully!",
                formatted_response
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

    async signToken(
        userId: string,
        email: string
    ): Promise<{access_token: string}> {
        const payload = {
            sub: userId,
            email
        };

        const token = await this.jwt.signAsync(payload, {
            expiresIn: this.config.get('JWT_EXPIRES_IN'),
            secret: this.config.get('JWT_SECRET')
        });

        return {
            access_token: token
        }
    }

    async signIn(payload: SignInDto) {
        
        console.log(colors.blue("Signing in..."));

        try {

            // find the user by email
            const existing_user = await this.prisma.user.findUnique({
                where: {
                    email: payload.email,
                }
            });

            // if user does not exist, return error
            if (!existing_user) {
                console.log(colors.red("User not found"));
                return ResponseHelper.error(
                    "User not found",
                    null
                );
            }

            // if user exists, compare the password with the hashed password
            const passwordMatches = await argon.verify(existing_user.password, payload.password);

            // if password matches, return success response with user data
            if(!passwordMatches) {
                console.log(colors.red("Password does not match"));
                return ResponseHelper.error(
                    "Password does not match",
                    null
                );
            }

            // if password match,es return success response
            console.log(colors.green("User signed in successfully!"));
            return this.signToken(
                existing_user.id,
                existing_user.email
            );
            
        } catch (error) {
            console.log(colors.red("Error signing in: "), error);
            return ResponseHelper.error(
                "Error signing in",
                error
            );
        }
    }

}

// generate a hashed password
            // const hashedPassword = await argon.hash(payload.password);
