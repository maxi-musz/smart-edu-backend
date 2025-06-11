import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { SchoolOwnership, SchoolType } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { OnboardDataDto, OnboardSchoolDto, RequestLoginOtpDTO, RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, VerifyEmailOTPDto, VerifyresetOtp } from 'src/shared/dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { sendOnboardingMailToSchoolOwner, sendOnboardingMailToBTechAdmin, sendPasswordResetOtp, sendLoginOtpByMail } from 'src/common/mailer/send-mail';
import * as crypto from "crypto"
import { Prisma } from '@prisma/client';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { OnboardClassesDto, OnboardTeachersDto, OnboardStudentsDto, OnboardDirectorsDto } from 'src/shared/dto/auth.dto';

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
                    first_name: "School",
                    last_name: "Director",
                    phone_number: dto.school_phone
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
    async directorRequestLoginOtp(dto: RequestLoginOtpDTO) {

        console.log(colors.cyan("Director requesting login otp..."))

        try {
            
            // Check if user exists
            const user = await this.prisma.school.findUnique({
                where: { school_email: dto.email },
            });
    
            if (!user) {
                console.log(colors.red("❌ Admin User not found"));
                throw new NotFoundException("Admin User not found");
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
            console.log(colors.magenta(`Login otp: ${otp} sucessfully sent to: ${dto.email}`))

            return new ApiResponse(
                true,
                "Otp successfully sent"
            )

        } catch (error) {
            console.log(colors.red("Error sigining in"))
            throw new InternalServerErrorException(
                `Failed to process OTP request: ${error instanceof Error ? error.message : String(error)}`
            ); 
        }
    }

    // Verify director login OTP
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

            // Sign in the user and return token
            return ResponseHelper.success(
                "Login successful",
                await this.signToken(user.id, user.email)
            );
        } catch (error) {
            
            console.error("Error verifying email:", error);
    
            if (error instanceof HttpException) {
                throw error; // Re-throw known exceptions
            }
    
            throw new InternalServerErrorException("Email verification failed");
        }
    }

    async signToken(
        userId: string,
        email: string
    ): Promise<{access_token: string}> {
        // console.log(colors.cyan('Signing token for:'), { userId, email });
        
        const payload = {
            sub: userId,
            email
        };

        const secret = this.config.get('JWT_SECRET');
        const expiresIn = this.config.get('JWT_EXPIRES_IN') || '7d'; 
        
        // console.log(colors.yellow('Token config:'), { secret, expiresIn });

        try {
            const token = await this.jwt.signAsync(payload, {
                expiresIn: expiresIn,
                secret: secret
            });

            // console.log(colors.green('Token generated successfully'));
            
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

    /////////////////////////////////////////////////////////// director onboarding 
    async onboardClasses(dto: OnboardClassesDto, user: any) {
        console.log(colors.cyan("Onboarding classes..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email}
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the classes already exist in the school
            const existingClasses = await this.prisma.class.findMany({
                where: {
                    name: {
                        in: dto.class_names
                    },
                    schoolId: existingSchool.id
                }
            });

            if (existingClasses.length > 0) {
                console.log(colors.red("Some classes already exist in this school"));
                throw new BadRequestException({
                    success: false,
                    message: "Some classes already exist in this school",
                    error: existingClasses.map(c => c.name),
                    statusCode: 400
                });
            }

            // Create the classes
            await this.prisma.class.createMany({
                data: dto.class_names.map(className => ({
                    name: className.toLowerCase().replace(/\s+/g, ''),
                    schoolId: existingSchool.id
                }))
            });

            // Fetch the created classes
            const createdClasses = await this.prisma.class.findMany({
                where: {
                    schoolId: existingSchool.id,
                    name: {
                        in: dto.class_names.map(name => name.toLowerCase().replace(/\s+/g, ''))
                    }
                }
            });

            console.log(colors.green("Classes created successfully!"));

            const formatted_response = createdClasses.map(cls => ({
                id: cls.id,
                name: cls.name,
                school_id: cls.schoolId,
                class_teacher_id: cls.classTeacherId || null,
                created_at: formatDate(cls.createdAt),
                updated_at: formatDate(cls.updatedAt)
            }));

            return ResponseHelper.success(
                "Classes created successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error creating class: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error creating class",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardTeachers(dto: OnboardTeachersDto, user: any) {
        console.log(colors.cyan("Onboarding teachers..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the emails already exist
            const existingEmails = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                    }
                }
            });

            if (existingEmails.length > 0) {
                console.log(colors.red("Some emails already exist in the system"));
                throw new BadRequestException({
                    success: false,
                    message: "Some emails already exist in the system",
                    error: existingEmails.map(u => u.email),
                    statusCode: 400
                });
            }

            // Generate default password for each teacher (first 3 letters of first name + last 4 digits of phone)
            const teachersWithPasswords = await Promise.all(
                dto.teachers.map(async (teacher) => {
                    const defaultPassword = `${teacher.first_name.slice(0, 3).toLowerCase()}${teacher.phone_number.slice(-4)}`;
                    const hashedPassword = await argon.hash(defaultPassword);
                    
                    return {
                        ...teacher,
                        password: hashedPassword,
                        defaultPassword // Store the unhashed password temporarily for email
                    };
                })
            );

            // Create the teachers
            const createdTeachers = await this.prisma.user.createMany({
                data: teachersWithPasswords.map(teacher => ({
                    email: teacher.email.toLowerCase(),
                    password: teacher.password,
                    role: "teacher",
                    school_id: existingSchool.id,
                    first_name: teacher.first_name.toLowerCase(),
                    last_name: teacher.last_name.toLowerCase(),
                    phone_number: teacher.phone_number
                }))
            });

            // Fetch the created teachers
            const teachers = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                    }
                }
            });

            console.log(colors.green("Teachers created successfully!"));

            const formatted_response = teachers.map(teacher => ({
                id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                email: teacher.email,
                phone_number: teacher.phone_number,
                role: teacher.role,
                school_id: teacher.school_id,
                created_at: formatDate(teacher.createdAt),
                updated_at: formatDate(teacher.updatedAt)
            }));

            return ResponseHelper.success(
                "Teachers onboarded successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error onboarding teachers: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error onboarding teachers",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardStudents(dto: OnboardStudentsDto, user: any) {
        console.log(colors.cyan("Onboarding students..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the emails already exist
            const existingEmails = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.students.map(student => student.email.toLowerCase())
                    }
                }
            });

            if (existingEmails.length > 0) {
                console.log(colors.red("Some emails already exist in the system"));
                throw new BadRequestException({
                    success: false,
                    message: "Some emails already exist in the system",
                    error: existingEmails.map(u => u.email),
                    statusCode: 400
                });
            }

            // Get all classes for the school
            const schoolClasses = await this.prisma.class.findMany({
                where: { schoolId: existingSchool.id }
            });

            // Validate that all default classes exist
            const requestedClasses = dto.students.map(student => 
                student.default_class.toLowerCase().replace(/\s+/g, '')
            );
            
            const invalidClasses = requestedClasses.filter(
                className => !schoolClasses.some(c => c.name === className)
            );

            if (invalidClasses.length > 0) {
                console.log(colors.red("Some selected classes do not exist in the school"));
                throw new BadRequestException({
                    success: false,
                    message: "Some classes do not exist in the school",
                    error: invalidClasses,
                    statusCode: 400
                });
            }

            // Generate default password for each student (first 3 letters of first name + last 4 digits of phone)
            const studentsWithPasswords = await Promise.all(
                dto.students.map(async (student) => {
                    const defaultPassword = `${student.first_name.slice(0, 3).toLowerCase()}${student.phone_number.slice(-4)}`;
                    const hashedPassword = await argon.hash(defaultPassword);
                    
                    return {
                        ...student,
                        password: hashedPassword,
                        defaultPassword // Store the unhashed password temporarily for email
                    };
                })
            );

            // Create the students
            const createdStudents = await this.prisma.user.createMany({
                data: studentsWithPasswords.map(student => ({
                    email: student.email.toLowerCase(),
                    password: student.password,
                    role: "student",
                    school_id: existingSchool.id,
                    first_name: student.first_name.toLowerCase(),
                    last_name: student.last_name.toLowerCase(),
                    phone_number: student.phone_number
                }))
            });

            // Fetch the created students
            const students = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.students.map(student => student.email.toLowerCase())
                    }
                }
            });

            // Enroll students in their default classes
            await Promise.all(
                students.map(async (student) => {
                    const studentData = dto.students.find(s => 
                        s.email.toLowerCase() === student.email.toLowerCase()
                    );
                    if (studentData) {
                        const classId = schoolClasses.find(c => 
                            c.name === studentData.default_class.toLowerCase().replace(/\s+/g, '')
                        )?.id;
                        if (classId) {
                            await this.prisma.user.update({
                                where: { id: student.id },
                                data: {
                                    classesEnrolled: {
                                        connect: { id: classId }
                                    }
                                }
                            });
                        }
                    }
                })
            );

            console.log(colors.green("Students created and enrolled successfully!"));

            const formatted_response = students.map(student => ({
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email,
                phone_number: student.phone_number,
                role: student.role,
                school_id: student.school_id,
                created_at: formatDate(student.createdAt),
                updated_at: formatDate(student.updatedAt)
            }));

            return ResponseHelper.success(
                "Students onboarded successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error onboarding students: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error onboarding students",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardDirectors(dto: OnboardDirectorsDto, user: any) {
        console.log(colors.cyan("Onboarding directors..."));

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Check if any of the emails already exist
            const existingEmails = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.directors.map(director => director.email.toLowerCase())
                    }
                }
            });

            if (existingEmails.length > 0) {
                console.log(colors.red("Some emails already exist in the system"));
                throw new BadRequestException({
                    success: false,
                    message: "Some emails already exist in the system",
                    error: existingEmails.map(u => u.email),
                    statusCode: 400
                });
            }

            // Generate default password for each director (first 3 letters of first name + last 4 digits of phone)
            const directorsWithPasswords = await Promise.all(
                dto.directors.map(async (director) => {
                    const defaultPassword = `${director.first_name.slice(0, 3).toLowerCase()}${director.phone_number.slice(-4)}`;
                    const hashedPassword = await argon.hash(defaultPassword);
                    
                    return {
                        ...director,
                        password: hashedPassword,
                        defaultPassword // Storing the unhashed password temporarily for email
                    };
                })
            );

            // Create the directors
            const createdDirectors = await this.prisma.user.createMany({
                data: directorsWithPasswords.map(director => ({
                    email: director.email.toLowerCase(),
                    password: director.password,
                    role: "school_director",
                    school_id: existingSchool.id,
                    first_name: director.first_name.toLowerCase(),
                    last_name: director.last_name.toLowerCase(),
                    phone_number: director.phone_number
                }))
            });

            // Fetch the created directors
            const directors = await this.prisma.user.findMany({
                where: {
                    email: {
                        in: dto.directors.map(director => director.email.toLowerCase())
                    }
                }
            });

            console.log(colors.green("Directors created successfully!"));

            const formatted_response = directors.map(director => ({
                id: director.id,
                first_name: director.first_name,
                last_name: director.last_name,
                email: director.email,
                phone_number: director.phone_number,
                role: director.role,
                school_id: director.school_id,
                created_at: formatDate(director.createdAt),
                updated_at: formatDate(director.updatedAt)
            }));

            return ResponseHelper.success(
                "Directors onboarded successfully",
                formatted_response
            );

        } catch (error) {
            console.log(colors.red("Error onboarding directors: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error onboarding directors",
                error: error.message,
                statusCode: 500
            });
        }
    }

    async onboardData(dto: OnboardDataDto, user: any) {
        console.log(colors.cyan("Starting comprehensive onboarding process..."));

        console.log("user: ", user)

        try {
            // Check if school exists
            const existingSchool = await this.prisma.school.findFirst({
                where: { school_email: user.email }
            });

            if (!existingSchool) {
                console.log(colors.red("School not found"));
                throw new NotFoundException({
                    success: false,
                    message: "School not found",
                    error: null,
                    statusCode: 404
                });
            }

            // Start a transaction
            return await this.prisma.$transaction(async (prisma) => {
                const response: any = {};

                // 1. Handle Classes
                if (dto.class_names && dto.class_names.length > 0) {
                    console.log(colors.cyan("Processing classes..."));
                    
                    // Check if any of the classes already exist
                    const existingClasses = await prisma.class.findMany({
                        where: {
                            name: {
                                in: dto.class_names.map(name => name.toLowerCase().replace(/\s+/g, ''))
                            },
                            schoolId: existingSchool.id
                        }
                    });

                    if (existingClasses.length > 0) {
                        console.log(colors.red("Some classes already exist in this school"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some classes already exist in this school",
                            error: existingClasses.map(c => c.name),
                            statusCode: 400
                        });
                    }

                    // Create the classes
                    await prisma.class.createMany({
                        data: dto.class_names.map(className => ({
                            name: className.toLowerCase().replace(/\s+/g, ''),
                            schoolId: existingSchool.id
                        }))
                    });

                    // Fetch created classes
                    const createdClasses = await prisma.class.findMany({
                        where: {
                            schoolId: existingSchool.id,
                            name: {
                                in: dto.class_names.map(name => name.toLowerCase().replace(/\s+/g, ''))
                            }
                        }
                    });

                    response.classes = createdClasses.map(cls => ({
                        id: cls.id,
                        name: cls.name,
                        school_id: cls.schoolId,
                        class_teacher_id: cls.classTeacherId || null,
                        created_at: formatDate(cls.createdAt),
                        updated_at: formatDate(cls.updatedAt)
                    }));
                }

                // 2. Handle Teachers
                if (dto.teachers && dto.teachers.length > 0) {
                    console.log(colors.cyan("Processing teachers..."));
                    
                    // Check if any emails already exist
                    const existingEmails = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                            }
                        }
                    });

                    if (existingEmails.length > 0) {
                        console.log(colors.red("Some teacher emails already exist in the system"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some teacher emails already exist in the system",
                            error: existingEmails.map(u => u.email),
                            statusCode: 400
                        });
                    }

                    // Generate passwords and create teachers
                    const teachersWithPasswords = await Promise.all(
                        dto.teachers.map(async (teacher) => {
                            const defaultPassword = `${teacher.first_name.slice(0, 3).toLowerCase()}${teacher.phone_number.slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);
                            return {
                                ...teacher,
                                password: hashedPassword,
                                defaultPassword
                            };
                        })
                    );

                    await prisma.user.createMany({
                        data: teachersWithPasswords.map(teacher => ({
                            email: teacher.email.toLowerCase(),
                            password: teacher.password,
                            role: "teacher",
                            school_id: existingSchool.id,
                            first_name: teacher.first_name.toLowerCase(),
                            last_name: teacher.last_name.toLowerCase(),
                            phone_number: teacher.phone_number
                        }))
                    });

                    // Fetch created teachers
                    const teachers = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.teachers.map(teacher => teacher.email.toLowerCase())
                            }
                        }
                    });

                    response.teachers = teachers.map(teacher => ({
                        id: teacher.id,
                        first_name: teacher.first_name,
                        last_name: teacher.last_name,
                        email: teacher.email,
                        phone_number: teacher.phone_number,
                        role: teacher.role,
                        school_id: teacher.school_id,
                        created_at: formatDate(teacher.createdAt),
                        updated_at: formatDate(teacher.updatedAt)
                    }));
                }

                // 3. Handle Students
                if (dto.students && dto.students.length > 0) {
                    console.log(colors.cyan("Processing students..."));
                    
                    // Check if any emails already exist
                    const existingEmails = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.students.map(student => student.email.toLowerCase())
                            }
                        }
                    });

                    if (existingEmails.length > 0) {
                        console.log(colors.red("Some student emails already exist in the system"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some student emails already exist in the system",
                            error: existingEmails.map(u => u.email),
                            statusCode: 400
                        });
                    }

                    // Get all classes for validation
                    const schoolClasses = await prisma.class.findMany({
                        where: { schoolId: existingSchool.id }
                    });

                    // Validate that all default classes exist
                    const requestedClasses = dto.students.map(student => 
                        student.default_class.toLowerCase().replace(/\s+/g, '')
                    );
                    
                    const invalidClasses = requestedClasses.filter(
                        className => !schoolClasses.some(c => c.name === className)
                    );

                    if (invalidClasses.length > 0) {
                        console.log(colors.red("Some selected classes do not exist in the school"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some selected classes do not exist in the school",
                            error: invalidClasses,
                            statusCode: 400
                        });
                    }

                    // Generate passwords and create students
                    const studentsWithPasswords = await Promise.all(
                        dto.students.map(async (student) => {
                            const defaultPassword = `${student.first_name.slice(0, 3).toLowerCase()}${student.phone_number.slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);
                            return {
                                ...student,
                                password: hashedPassword,
                                defaultPassword
                            };
                        })
                    );

                    await prisma.user.createMany({
                        data: studentsWithPasswords.map(student => ({
                            email: student.email.toLowerCase(),
                            password: student.password,
                            role: "student",
                            school_id: existingSchool.id,
                            first_name: student.first_name.toLowerCase(),
                            last_name: student.last_name.toLowerCase(),
                            phone_number: student.phone_number
                        }))
                    });

                    // Fetch created students
                    const students = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.students.map(student => student.email.toLowerCase())
                            }
                        }
                    });

                    // Enroll students in their default classes
                    await Promise.all(
                        students.map(async (student) => {
                            const studentData = dto.students?.find(s => 
                                s.email.toLowerCase() === student.email.toLowerCase()
                            );
                            if (studentData) {
                                const classId = schoolClasses.find(c => 
                                    c.name === studentData.default_class.toLowerCase().replace(/\s+/g, '')
                                )?.id;
                                if (classId) {
                                    await prisma.user.update({
                                        where: { id: student.id },
                                        data: {
                                            classesEnrolled: {
                                                connect: { id: classId }
                                            }
                                        }
                                    });
                                }
                            }
                        })
                    );

                    response.students = students.map(student => ({
                        id: student.id,
                        first_name: student.first_name,
                        last_name: student.last_name,
                        email: student.email,
                        phone_number: student.phone_number,
                        role: student.role,
                        school_id: student.school_id,
                        created_at: formatDate(student.createdAt),
                        updated_at: formatDate(student.updatedAt)
                    }));
                }

                // 4. Handle Directors
                if (dto.directors && dto.directors.length > 0) {
                    console.log(colors.cyan("Processing directors..."));
                    
                    // Check if any emails already exist
                    const existingEmails = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.directors.map(director => director.email.toLowerCase())
                            }
                        }
                    });

                    if (existingEmails.length > 0) {
                        console.log(colors.red("Some director emails already exist in the system"));
                        throw new BadRequestException({
                            success: false,
                            message: "Some director emails already exist in the system",
                            error: existingEmails.map(u => u.email),
                            statusCode: 400
                        });
                    }

                    // Generate passwords and create directors
                    const directorsWithPasswords = await Promise.all(
                        dto.directors.map(async (director) => {
                            const defaultPassword = `${director.first_name.slice(0, 3).toLowerCase()}${director.phone_number.slice(-4)}`;
                            const hashedPassword = await argon.hash(defaultPassword);
                            return {
                                ...director,
                                password: hashedPassword,
                                defaultPassword
                            };
                        })
                    );

                    await prisma.user.createMany({
                        data: directorsWithPasswords.map(director => ({
                            email: director.email.toLowerCase(),
                            password: director.password,
                            role: "school_director",
                            school_id: existingSchool.id,
                            first_name: director.first_name.toLowerCase(),
                            last_name: director.last_name.toLowerCase(),
                            phone_number: director.phone_number
                        }))
                    });

                    // Fetch created directors
                    const directors = await prisma.user.findMany({
                        where: {
                            email: {
                                in: dto.directors.map(director => director.email.toLowerCase())
                            }
                        }
                    });

                    response.directors = directors.map(director => ({
                        id: director.id,
                        first_name: director.first_name,
                        last_name: director.last_name,
                        email: director.email,
                        phone_number: director.phone_number,
                        role: director.role,
                        school_id: director.school_id,
                        created_at: formatDate(director.createdAt),
                        updated_at: formatDate(director.updatedAt)
                    }));
                }

                console.log(colors.green("Comprehensive onboarding completed successfully!"));

                return ResponseHelper.success(
                    "Data onboarded successfully",
                    response
                );
            }, {
                maxWait: 10000, // Maximum time to wait for transaction to start
                timeout: 30000  // Maximum time for entire transaction to complete
            });

        } catch (error) {
            console.log(colors.red("Error in comprehensive onboarding: "), error);
            
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: "Error in comprehensive onboarding",
                error: error.message,
                statusCode: 500
            });
        }
    }

}
 