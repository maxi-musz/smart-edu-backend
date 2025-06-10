import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { SchoolOwnership, SchoolType } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { OnboardSchoolDto, RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, VerifyresetOtp } from 'src/shared/dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { sendOnboardingMailToSchoolOwner, sendOnboardingMailToBTechAdmin, sendPasswordResetOtp } from 'src/common/mailer/send-mail';
import * as crypto from "crypto"
import { Prisma } from '@prisma/client';
import { ApiResponse } from 'src/shared/helper-functions/response';

interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    original_filename: string;
}

@Injectable()
export class AuthService {

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private readonly cloudinaryService: CloudinaryService
    ) {}
    
    // Onboard new school
    async onboardSchool(dto: OnboardSchoolDto, files: Express.Multer.File[]) {
        
        console.log(colors.blue('Onboarding a new school...'));
        console.log("email: ", dto.school_email)
        
        const existingSchool = await this.prisma.school.findFirst({
            where: {
                school_email: dto.school_email
            }
        })
    
        if(existingSchool) {
            console.log("School already exists... ")
            throw ResponseHelper.error(
                "School already exists... "
            )
        }

        let uploadedFiles: CloudinaryUploadResult[] = [];
        try {
            const defaultPassword = `${dto.school_name.slice(0, 3).toLowerCase().replace(/\s+/g, '')}/sm/${dto.school_phone.slice(-4)}`;
    
            uploadedFiles = await this.cloudinaryService.uploadToCloudinary(files);

            // hash the password 
            const hashedPassword = await argon.hash(defaultPassword);
            console.log(colors.green("Hashed password: "), hashedPassword);

            // create a new school in the database
            const school = await this.prisma.school.create({
                data: {
                    school_name: dto.school_name.toLowerCase(),
                    school_email: dto.school_email.toLowerCase(),
                    school_phone: dto.school_phone,
                    school_address: dto.school_address.toLowerCase(),
                    school_type: dto.school_type.toLowerCase() as SchoolType,
                    school_ownership: dto.school_ownership.toLowerCase() as SchoolOwnership,
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
                    status: 'pending'
                }
            });

            // create new user also with email and hashed password
            await this.prisma.user.create({
                data: {
                    email: dto.school_email.toLowerCase(),
                    password: hashedPassword,
                    role: "school_director", 
                    school_id: school.id, 
                }
            });

            // Try to send emails, but don't fail the whole operation if they fail
            try {
                // send mail to school owner
                await sendOnboardingMailToSchoolOwner({
                    school_name: dto.school_name,
                    school_email: dto.school_email,
                    school_phone: dto.school_phone,
                    school_address: dto.school_address,
                    school_type: dto.school_type,
                    school_ownership: dto.school_ownership,
                    documents: {
                        cac: uploadedFiles[0]?.secure_url || null,
                        utility_bill: uploadedFiles[1]?.secure_url || null,
                        tax_clearance: uploadedFiles[2]?.secure_url || null,
                    },
                });

                // send mail to admin
                await sendOnboardingMailToBTechAdmin({
                    school_name: dto.school_name,
                    school_email: dto.school_email,
                    school_phone: dto.school_phone,
                    school_address: dto.school_address,
                    school_type: dto.school_type,
                    school_ownership: dto.school_ownership,
                    documents: {
                        cac: uploadedFiles[0]?.secure_url || null,
                        utility_bill: uploadedFiles[1]?.secure_url || null,
                        tax_clearance: uploadedFiles[2]?.secure_url || null,
                    },
                    defaultPassword: defaultPassword,
                });
            } catch (emailError) {
                // Log the email error but don't fail the operation
                console.log(colors.yellow("Warning: Failed to send emails: "), emailError);
                // You might want to store this error in a log or database for later retry
            }

            const formatted_response = {
                id: school.id,
                school_name: school.school_name,
                school_email: school.school_email,
                school_address: school.school_address,
                documents: {
                    cac: uploadedFiles[0]?.secure_url || null,
                    utility_bill: uploadedFiles[1]?.secure_url || null,
                    tax_clearance: uploadedFiles[2]?.secure_url || null,
                },
                created_at: formatDate(school.createdAt),
                updated_at: formatDate(school.updatedAt),
            };

            // return the newly created school
            console.log(colors.magenta("New school created successfully!"));
            return ResponseHelper.created('School onboarded successfully', formatted_response);
            
        } catch (error) {
            console.log(colors.red("Error creating new school: "), error);
            
            // Only clean up files if the error occurred during school/user creation
            // Not during email sending
            if (uploadedFiles.length > 0 && !error.message?.includes('No recipients defined')) {
                console.log(colors.yellow("Cleaning up uploaded files due to error..."));
                await this.cloudinaryService.cleanupUploadedFiles(uploadedFiles);
            }
            
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
                throw new NotFoundException({
                    success: false,
                    message: "User not found",
                    error: null,
                    statusCode: 404
                });
            }

            // if user exists, compare the password with the hashed password
            const passwordMatches = await argon.verify(existing_user.password, payload.password);

            // if password matches, return success response with user data
            if(!passwordMatches) {
                console.log(colors.red("Password does not match"));
                throw new BadRequestException({
                    success: false,
                    message: "Passwords do not match",
                    error: null,
                    statusCode: 400
                });
            }

            // if password matches, return success response
            console.log(colors.green("User signed in successfully!"));
            return ResponseHelper.success(
                "User signed in successfully",
                await this.signToken(existing_user.id, existing_user.email)
            );
            
        } catch (error) {
            console.log(colors.red("Error signing in: "), error);
            
            // If it's already a HttpException, just rethrow it
            if (error instanceof HttpException) {
                throw error;
            }
            
            // For other errors, wrap them in a proper response
            throw new InternalServerErrorException({
                success: false,
                message: "Error signing in",
                error: error.message,
                statusCode: 500
            });
        }
    }

    //
    async requestPasswordResetOTP(payload: RequestPasswordResetDTO) {
        console.log(colors.blue("Requesting password reset otp..."))

        try {
            const existing_user = await this.prisma.user.findFirst({
                where: {
                    email: payload.email
                }
            })

            // if user not found
            if(!existing_user) {
                console.log(colors.red("User not found..."))
                throw new NotFoundException("User not found");
            }

            // generate 6 random digits 
            const otp = crypto.randomInt(100000, 999999).toString();
            const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            // Update OTP for the user
            await this.prisma.user.update({
                where: {
                    id: existing_user.id
                },
                data: {
                    otp: otp,
                    otp_expires_at: otpExpiresAt,
                } as Prisma.UserUpdateInput
            });

            // TODO: Send OTP via email
            await sendPasswordResetOtp({
                email: payload.email,
                otp
            })

            console.log(colors.magenta(`OTP ${otp} successfully sent to ${payload.email}`));
            
            return ResponseHelper.success(
                "OTP sent successfully",
                { email: payload.email }
            );
            
        } catch (error) {
            console.log(colors.red("Error requesting password reset: "), error);
            throw error;
        }
    }

    // Verify director login OTP
    async verifyResetPasswordOTP(dto: VerifyresetOtp) {
        console.log(colors.cyan(`Verifying email: ${dto.email} with OTP: ${dto.otp}`));

        try {
            // Find user with matching email and OTP
            const user = await this.prisma.user.findFirst({
                where: { email: dto.email, otp: dto.otp },
            });

            // Check if user exists and OTP is valid
            if (!user || !user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
                console.log(colors.red("Invalid or expired OTP provided"));
                
                // Clear the OTP if user exists but OTP is invalid/expired
                if (user) {
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            otp: "",
                            otp_expires_at: null,
                            is_otp_verified: false
                        },
                    });
                }
                
                throw new BadRequestException("Invalid or expired OTP provided");
            }

            // Update user with verified OTP and clear OTP fields
            const updatedUser = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    is_otp_verified: true,
                    otp: "",
                    otp_expires_at: null,
                },
            });

            // Verify the update was successful
            if (updatedUser.otp !== "" || updatedUser.otp_expires_at !== null) {
                console.log(colors.red("Failed to clear OTP fields"));
                // throw new InternalServerErrorException("Failed to clear OTP fields");
            }

            console.log(colors.magenta("OTP successfully verified"));

            return new ApiResponse(true, "OTP verified successfully, Proceed and change your password");
        } catch (error) {
            console.error("Error verifying OTP:", error);

            if (error instanceof HttpException) {
                throw error; // Re-throw known exceptions
            }

            throw new InternalServerErrorException("OTP verification failed");
        }
    }

    async resetPassword(dto: ResetPasswordDTO) {
        console.log(colors.cyan("Resetting password..."))

        try {

            // compare new_password and compare_password
            if(dto.new_password !== dto.confirm_password) {
                console.log(colors.red("New password and confirm Password do not match"))
                throw new BadRequestException({
                    success: false,
                    message: "New password and confirm Password do not match",
                    error: null,
                    statusCode: 400
                });
            }

            const existingUser = await this.prisma.user.findFirst({
                where: { 
                    email: dto.email,
                    is_otp_verified: true
                }
            });

            if (!existingUser || !existingUser.is_otp_verified) {
                throw new BadRequestException("User not found or OTP not verified");
            }

            // Hash the new password
            const hashedPassword = await argon.hash(dto.new_password);

            // Update the password
            await this.prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    is_otp_verified: false // Reset OTP verification status
                }
            });

            return new ApiResponse(true, "Password reset successfully");
        } catch (error) {
            console.error("Error resetting password:", error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException("Failed to reset password");
        }
    }

}

// generate a hashed password
            // const hashedPassword = await argon.hash(payload.password);
