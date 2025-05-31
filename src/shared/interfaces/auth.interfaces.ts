export interface OnboardSchool {
    schoolName: string;
    schoolEmail: string;
    schoolAddress: string;
    schoolPhone: string;
    schoolType: string;
    schoolCountry: string;
    schoolState: string;
    schoolCity: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OnboardAdmin {
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
    adminRole: string; // e.g., 'superadmin', 'admin'
    schoolId: string; // Reference to the school being onboarded
    createdAt: Date;
    updatedAt: Date;
}

export interface Login{
    email: string;
    password: string;
}

export interface VerifyOTP {
    email: string;
    otp: string;
}