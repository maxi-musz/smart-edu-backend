import * as colors from "colors"
import * as nodemailer from "nodemailer";
import { onboardingMailTemplate } from "../email-templates/onboard-mail";
import { ResponseHelper } from "src/shared/helper-functions/response.helpers";
import { onboardingSchoolAdminNotificationTemplate } from "../email-templates/onboard-mail-admin";
import { passwordResetTemplate } from "../email-templates/password-reset-template";

// add the interface for the mail to send 
export interface OnboardingMailPayload {
    school_name: string;
    school_email: string;
    school_phone: string;
    school_address: string;
    school_type: string;
    school_ownership: string;
    documents: {
        cac?: string | null;
        utility_bill?: string | null;
        tax_clearance?: string | null;
    };
}

interface OnboardingAdminPayload {
    school_name: string;
    school_email: string;
    school_phone: string;
    school_address: string;
    school_type: string;
    school_ownership: string;
    documents: {
      cac: string | null;
      utility_bill: string | null;
      tax_clearance: string | null;
    };
    defaultPassword: string | null;
}

interface SendResetOtpProps {
    email: string;
    otp: string;
}


////////////////////////////////////////////////////////////            Send mail to school owner
export const sendOnboardingMailToSchoolOwner = async (
    payload: OnboardingMailPayload
): Promise<void> => {
    console.log(colors.yellow("Sending mail to school owner..."))

    try {

        // Check if env vars exist (optional but recommended)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ||!process.env.otpExpiresAt) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: process.env.GOOGLE_SMTP_HOST,
            port: process.env.GOOGLE_SMTP_PORT ? parseInt(process.env.GOOGLE_SMTP_PORT) : 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const htmlContent = onboardingMailTemplate({ ...payload});

        const mailOptions = {
            from: {
              name: "Smart Edu Hub",
              address: process.env.EMAIL_USER as string,
            },
            to: payload.school_email,
            subject: `Welcome to Smart Edu Hub`,
            html: htmlContent,
          };

        await transporter.sendMail(mailOptions);

        console.log(colors.green(`Onboarding email sent to ${payload.school_email}`));
        
    } catch (error) {
        console.log(colors.red("Error sending onboarding email: "), error);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        )
    }
}

////////////////////////////////////////////////////////////             Send mail to Best tech Admin
export const sendOnboardingMailToBTechAdmin = async (
    payload: OnboardingAdminPayload
): Promise<void> => {

    try {

        console.log(colors.yellow("Sending mail to Best Tech..."))

        // Check if env vars exist (optional but recommended)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ||!process.env.otpExpiresAt) {
            throw new Error("SMTP credentials missing in environment variables");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: process.env.GOOGLE_SMTP_HOST,
            port: process.env.GOOGLE_SMTP_PORT ? parseInt(process.env.GOOGLE_SMTP_PORT) : 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const htmlContent = onboardingSchoolAdminNotificationTemplate({ ...payload});

        const adminEmail = process.env.BTECH_ADMIN_EMAIL || "besttechnologies25@gmail.com"

        const mailOptions = {
            from: {
              name: "Smart Edu Hub",
              address: process.env.EMAIL_USER as string,
            },
            to: adminEmail,
            subject: `New Registration on Smart Edu Hub`,
            html: htmlContent,
          };

        await transporter.sendMail(mailOptions);

        console.log(colors.green(`New school Onboarding email sent to ${adminEmail}`));
        
    } catch (error) {
        console.log(colors.red("Error sending onboarding email to admin: "), error);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        )
    }
    //   service: 'gmail',
    //   host: process.env.GOOGLE_SMTP_HOST,
    //   port: process.env.GOOGLE_SMTP_PORT ? parseInt(process.env.GOOGLE_SMTP_PORT) : 587,
    //   secure: false,
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });

    // const htmlContent = onboardingSchoolAdminNotificationTemplate(payload);

    // const mailOptions = {
    //   from: {
    //     name: 'Smart Edu Hub',
    //     address: process.env.EMAIL_USER as string,
    //   },
    //   to: process.env.BTECH_ADMIN_EMAIL as string || "bernardmayowaa@gmail.com",
    //   subject: `🚀 New School Onboarding: ${payload.school_name}`,
    //   html: htmlContent,
    // };
  
    // await transporter.sendMail(mailOptions);
  };
  
  ////////////////////////////////////////////////////////////             Send password reset email
  export const sendPasswordResetOtp = async ({ email, otp }: SendResetOtpProps): Promise<void> => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.GOOGLE_SMTP_HOST,
      port: process.env.GOOGLE_SMTP_PORT ? parseInt(process.env.GOOGLE_SMTP_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  
    const htmlContent = passwordResetTemplate(otp);
  
    const mailOptions = {
      from: {
        name: 'Smart Edu Hub',
        address: process.env.EMAIL_USER as string,
      },
      to: email,
      subject: `🔐 Your Password Reset Code`,
      html: htmlContent,
    };
  
    await transporter.sendMail(mailOptions);
  };