import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { loggedInUserProfileDto, RegisterDto, RequestLoginOtpDTO, RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, VerifyEmailOTPDto, VerifyresetOtp } from 'src/shared/dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { sendPasswordResetOtp, sendLoginOtpByMail, sendOnboardingMailToStoreOwner, sendOnboardingMailToPlatformAdmin } from 'src/common/mailer/send-mail';
import * as crypto from "crypto"
import { Prisma, StoreStatus } from '@prisma/client';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { OnboardStoreDTO } from 'src/shared/dto/store.dto';
import { first } from 'rxjs';

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

    // Request login OTP
    async requestLoginOtp(dto: RequestLoginOtpDTO) {
        console.log(colors.cyan("Requesting login otp..."))

        try {
            // Check if user exists
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
    
            if (!user) {
                console.log(colors.red("❌ User not found"));
                throw new NotFoundException("User not found");
            }
    
            const otp = crypto.randomInt(1000, 9999).toString();
            const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry
    
            // Update OTP for the user
            await this.prisma.user.update({
                where: { email: dto.email },
                data: {
                    otp,
                    otp_expires_at: otpExpiresAt,
                },
            });

            await sendLoginOtpByMail({ email: dto.email, otp })
            console.log(colors.magenta(`Login otp: ${otp} successfully sent to: ${dto.email}`))

            return new ApiResponse(
                true,
                "OTP successfully sent"
            )

        } catch (error) {
            console.log(colors.red("Error signing in"))
            throw new InternalServerErrorException(
                `Failed to process OTP request: ${error instanceof Error ? error.message : String(error)}`
            ); 
        }
    }

    // Verify login OTP
    async verifyEmailOTPAndSignIn(dto: VerifyEmailOTPDto) {
        console.log(colors.cyan(`Verifying email: ${dto.email} with OTP: ${dto.otp}`));
    
        try {
            // Find user with matching email and OTP
            const user = await this.prisma.user.findFirst({
                where: { email: dto.email, otp: dto.otp },
            });
    
            // Check if user exists and OTP is valid
            if (!user || !user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
                console.log(colors.red("Invalid or expired OTP provided"));
                throw new BadRequestException("Invalid or expired OTP provided");
            }
    
            // Update `is_email_verified` and clear OTP
            await this.prisma.user.update({
                where: { email: dto.email },
                data: {
                    is_email_verified: true,
                    otp: "",
                    otp_expires_at: null,
                },
            });
    
            console.log(colors.magenta("Email address successfully verified"));

            // Sign in the user and return token and role
            return ResponseHelper.success(
                "Login successful",
                {
                    ...await this.signToken(user.id, user.email, user.role),
                    role: user.role
                }
            );
        } catch (error) {
            console.error("Error verifying email:", error);
    
            if (error instanceof HttpException) {
                throw error;
            }
    
            throw new InternalServerErrorException("Email verification failed");
        }
    }

    async signToken(
        userId: string,
        email: string,
        role: string
    ): Promise<{access_token: string}> {
        const payload = {
            sub: userId,
            email,
            role
        };

        const secret = this.config.get('JWT_SECRET');
        const expiresIn = this.config.get('JWT_EXPIRES_IN') || '7d'; 
        
        try {
            const token = await this.jwt.signAsync(payload, {
                expiresIn: expiresIn,
                secret: secret
            });
            
            return {
                access_token: token
            }
        } catch (error) {
            console.log(colors.red('Error generating token:'), error);
            throw error;
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

            if(!passwordMatches) {
                console.log(colors.red("Password does not match"));
                throw new BadRequestException({
                    success: false,
                    message: "Passwords do not match",
                    error: null,
                    statusCode: 400
                });
            }

            // Check user role
            if (existing_user.role !== 'user') {
                // Generate OTP
                const otp = crypto.randomInt(1000, 9999).toString();
                const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

                // Update OTP for the user
                await this.prisma.user.update({
                    where: { email: payload.email },
                    data: {
                        otp,
                        otp_expires_at: otpExpiresAt,
                    },
                });

                // Send OTP to email
                await sendLoginOtpByMail({ email: payload.email, otp });

                // Return role to frontend (no token)
                return ResponseHelper.success(
                    "OTP sent to email. Please verify to continue.",
                    { role: existing_user.role }
                );
            }

            // If role is 'user', proceed as normal
            console.log(colors.green("User signed in successfully!"));
            return ResponseHelper.success(
                "User signed in successfully",
                {
                    ...await this.signToken(existing_user.id, existing_user.email, existing_user.role),
                    role: existing_user.role
                }
            );

        } catch (error) {
            console.log(colors.red("Error signing in: "), error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException({
                success: false,
                message: "Error signing in",
                error: error.message,
            });
        }
    }

    async register(payload: RegisterDto) {
        console.log(colors.cyan("Registering a new user"))

        try {
            // Check if user already exists
            const existingUser = await this.prisma.user.findFirst({
                where: { email: payload.email }
            });

            if (existingUser) {
                console.log(colors.red("User already exists"))
                return new ApiResponse(
                    false,
                    "User already exist"
                );
            }

            // Hash the password
            const hashedPassword = await argon.hash(payload.password);

            // Create the user
            const newUser = await this.prisma.user.create({
                data: {
                    first_name: payload.first_name,
                    last_name: payload.last_name,
                    email: payload.email,
                    password: hashedPassword,
                }
            });

            // Generate a unique referral code and URL for the new user
            let uniqueCode: string;
            let uniqueUrl: string;
            while (true) {
                // You can use a better generator if you want
                uniqueCode = (newUser.first_name.substring(0, 3) + newUser.last_name.substring(0, 3) + Math.floor(Math.random() * 100000)).toLowerCase();
                uniqueUrl = `https://access-slr.com/ref/${uniqueCode}`;
                const exists = await this.prisma.referralCode.findUnique({ where: { code: uniqueCode } });
                if (!exists) break;
            }
            await this.prisma.referralCode.create({
                data: {
                    code: uniqueCode,
                    url: uniqueUrl,
                    userId: newUser.id,
                }
            });

            // Handle referral logic if referral_code is provided
            if (payload.referral_code) {
                // Find the referrer by referral code
                const referrer = await this.prisma.referralCode.findUnique({
                    where: { code: payload.referral_code },
                    include: { user: true }
                });
                if (referrer && referrer.user) {
                    // Create a Referral record
                    await this.prisma.referral.create({
                        data: {
                            referrerId: referrer.user.id,
                            referredId: newUser.id,
                            code: payload.referral_code,
                            productId: '',
                        }
                    });
                } else {
                    console.log(colors.yellow('Invalid referral code provided, skipping referral linkage.'));
                }
            }

            const userResponse = {
                id: newUser.id,
                email: newUser.email,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                createdAt: newUser.createdAt,
            };

            return new ApiResponse(
                true,
                "User registered successfully",
                userResponse
            );
        } catch (error) {
            console.log(colors.red("Error registering user"), error);
            return new ApiResponse(
                false,
                "Error registering user"
            );
        }
    }

    async fetchLoggedInUserProfile(user) {
        console.log(colors.cyan("Fetching logged in user details for user: "), user.suub)

        try {
            const existing_user = await this.prisma.user.findFirst({
                where: {
                    email: user.email,
                }
            })

            if(!existing_user) {
                console.log(colors.red("User does not exist"))
                return new ApiResponse(
                    false,
                    "User does not exist"
                )
            }

            // Fetch total orders and total cart items for the user
            const [totalOrders, totalCartItems] = await Promise.all([
                this.prisma.order.count({ where: { userId: existing_user.id } }),
                this.prisma.cartItem.count({ where: { cart: { userId: existing_user.id } } })
            ]);

            const formatted_user_response = {
                id: existing_user.id,
                email: existing_user.email,
                first_name: existing_user.first_name,
                last_name: existing_user.last_name,
                phone_number: existing_user.phone_number || "+2348146694787",
                profile_picture: existing_user.display_picture,
                role: existing_user.role,
                is_affiliate: existing_user.isAffiliate,
                affiliate_status: existing_user.affiliateStatus,
                joined_date: formatDate(existing_user.createdAt),
                address: existing_user.address || "",
                stats: {
                    totalOrders,
                    totalCartItems
                }
            }

            console.log(colors.magenta("User successfully retrieved"))
            return new ApiResponse(
                true,
                "User details successfully retrieved",
                formatted_user_response
            )
        } catch (error) {
            console.log(colors.red(error))
            return new ApiResponse(
                false,
                "Error fetching user details",
            )
        }
    }

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

            console.log(colors.magenta("OTP successfully verified"));

            return new ApiResponse(true, "OTP verified successfully, Proceed and change your password");
        } catch (error) {
            console.error("Error verifying OTP:", error);

            if (error instanceof HttpException) {
                throw error;
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

    async onboardStore(dto: OnboardStoreDTO, files: Express.Multer.File[]) {
        console.log(colors.blue('Onboarding a new store...'));
        console.log("email: ", dto.email);
        
        const existingStore = await this.prisma.store.findFirst({
            where: {
                email: dto.email
            }
        });
    
        if(existingStore) {
            console.log("Store already exists... ");
            throw ResponseHelper.error(
                "Store already exists... "
            );
        }

        let uploadedFiles: CloudinaryUploadResult[] = [];
        try {
            const defaultPassword = `${dto.name.slice(0, 3).toLowerCase().replace(/\s+/g, '')}/sm/${dto.phone.slice(-4)}`;

            uploadedFiles = await this.cloudinaryService.uploadToCloudinary(files);

            // hash the password 
            const hashedPassword = await argon.hash(defaultPassword);
            console.log(colors.green("Hashed password: "), hashedPassword);

            // create a new store in the database
            const store = await this.prisma.store.create({
                data: {
                    name: dto.name.toLowerCase(),
                    email: dto.email.toLowerCase(),
                    phone: dto.phone,
                    address: dto.address.toLowerCase(),
                    description: dto.description,
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
                    status: StoreStatus.pending
                }
            });

            // create new user also with email and hashed password
            await this.prisma.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    password: hashedPassword,
                    role: "inventory_manager",
                    store_id: store.id,
                    first_name: "Store",
                    last_name: "Manager",
                    phone_number: dto.phone
                }
            });

            // Try to send emails, but don't fail the whole operation if they fail
            try {
                // send mail to store owner
                await sendOnboardingMailToStoreOwner({
                    store_name: dto.name,
                    store_email: dto.email,
                    store_phone: dto.phone,
                    store_address: dto.address,
                    documents: {
                        cac: uploadedFiles[0]?.secure_url || null,
                        utility_bill: uploadedFiles[1]?.secure_url || null,
                        tax_clearance: uploadedFiles[2]?.secure_url || null,
                    },
                });

                // send mail to admin
                await sendOnboardingMailToPlatformAdmin({
                    store_name: dto.name,
                    store_email: dto.email,
                    store_phone: dto.phone,
                    store_address: dto.address,
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
                id: store.id,
                name: store.name,
                email: store.email,
                address: store.address,
                documents: {
                    cac: uploadedFiles[0]?.secure_url || null,
                    utility_bill: uploadedFiles[1]?.secure_url || null,
                    tax_clearance: uploadedFiles[2]?.secure_url || null,
                },
                created_at: formatDate(store.createdAt),
                updated_at: formatDate(store.updatedAt),
            };

            // return the newly created store
            console.log(colors.magenta("New store created successfully!"));
            return ResponseHelper.created('Store onboarded successfully', formatted_response);
            
        } catch (error) {
            console.log(colors.red("Error creating new store: "), error);
            
            // Only clean up files if the error occurred during store/user creation
            // Not during email sending
            if (uploadedFiles.length > 0 && !error.message?.includes('No recipients defined')) {
                console.log(colors.yellow("Cleaning up uploaded files due to error..."));
                await this.cloudinaryService.cleanupUploadedFiles(uploadedFiles);
            }
            
            return ResponseHelper.error(
                "Error creating new store",
                error
            );
        }
    }

    async resendLoginOtp(dto: RequestLoginOtpDTO) {
        console.log(colors.cyan("Resending login OTP..."));

        try {
            // Check if user exists
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });

            if (!user || user.role === "user") {
                console.log(colors.red("Admin user not found for OTP resend"));
                throw new NotFoundException("Admin user not found");
            }

            // Generate new OTP
            const otp = crypto.randomInt(1000, 9999).toString();
            const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

            // Update OTP for the user
            await this.prisma.user.update({
                where: { email: dto.email },
                data: {
                    otp,
                    otp_expires_at: otpExpiresAt,
                },
            });

            // Send OTP to email
            await sendLoginOtpByMail({ email: dto.email, otp });
            console.log(colors.magenta(`Login OTP resent: ${otp} to: ${dto.email}`));

            return ResponseHelper.success(
                "A new OTP has been sent to your email. Please check your inbox and spam folder.",
                { email: dto.email }
            );
        } catch (error) {
            console.log(colors.red("Error resending login OTP: "), error);
            throw new InternalServerErrorException(
                `Failed to resend OTP: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
 