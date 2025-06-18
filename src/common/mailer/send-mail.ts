import * as colors from "colors"
import * as nodemailer from "nodemailer";
import { onboardingMailTemplate } from "../email-templates/onboard-mail";
import { ResponseHelper } from "src/shared/helper-functions/response.helpers";
import { onboardingSchoolAdminNotificationTemplate } from "../email-templates/onboard-mail-admin";
import { passwordResetTemplate } from "../email-templates/password-reset-template";
import { loginOtpTemplate } from "../email-templates/login-otp-template";

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

interface StoreOnboardingMailData {
    store_name: string;
    store_email: string;
    store_phone: string;
    store_address: string;
    documents: {
        cac: string | null;
        utility_bill: string | null;
        tax_clearance: string | null;
    };
    defaultPassword?: string;
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
              name: "Access-sellr",
              address: process.env.EMAIL_USER as string,
            },
            to: payload.school_email,
            subject: `Welcome to Access-sellr`,
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

export const sendLoginOtpByMail = async ({ email, otp}: SendResetOtpProps): Promise<void> => {
  console.log(colors.green(`Sending login otp to admin email: ${email}`))

  try {
    
    // Check if env vars exist (optional but recommended)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
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

  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const htmlContent = loginOtpTemplate(email, otp, otpExpiresAt);

  const mailOptions = {
      from: {
          name: "PayFlex LTD",
          address: process.env.EMAIL_USER as string,
      },
      to: email,
      subject: `Login OTP Confirmation Code: ${otp}`,
      html: htmlContent
  };

  await transporter.sendMail(mailOptions);

  } catch (error) {
    console.error('Error sending otp email:', error);
    throw new Error('Failed to send OTP email');
  }
}

export async function sendOnboardingMailToStoreOwner(data: StoreOnboardingMailData) {
    const { store_name, store_email, store_phone, store_address, documents } = data;

    try {
        // Check if env vars exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
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

        const mailOptions = {
            from: {
                name: "Acces-Sellr",
                address: process.env.EMAIL_USER as string,
            },
            to: store_email,
            subject: 'Welcome to Acces-Sellr Platform',
            html: `
                <h1>Welcome to Acces-Sellr Platform!</h1>
                <p>Dear ${store_name},</p>
                <p>Thank you for registering your store with Acces-Sellr. Your store details have been received and are being reviewed.</p>
                <p>Store Details:</p>
                <ul>
                    <li>Name: ${store_name}</li>
                    <li>Email: ${store_email}</li>
                    <li>Phone: ${store_phone}</li>
                    <li>Address: ${store_address}</li>
                </ul>
                <p>Documents Submitted:</p>
                <ul>
                    <li>CAC Document: ${documents.cac ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Utility Bill: ${documents.utility_bill ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Tax Clearance: ${documents.tax_clearance ? 'Submitted' : 'Not Submitted'}</li>
                </ul>
                <p>We will review your application and get back to you shortly.</p>
                <p>Best regards,<br>Acces-Sellr Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(colors.green(`Onboarding email sent to store owner: ${store_email}`));
    } catch (error) {
        console.log(colors.red("Error sending onboarding email to store owner: "), error);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        );
    }
}

export async function sendOnboardingMailToPlatformAdmin(data: StoreOnboardingMailData) {
    const { store_name, store_email, store_phone, store_address, documents, defaultPassword } = data;

    try {
        // Check if env vars exist
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
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

        const adminEmail = process.env.ADMIN_EMAIL || "admin@acces-sellr.com";

        const mailOptions = {
            from: {
                name: "Acces-Sellr",
                address: process.env.EMAIL_USER as string,
            },
            to: adminEmail,
            subject: 'New Store Registration - Acces-Sellr',
            html: `
                <h1>New Store Registration</h1>
                <p>A new store has registered on the Acces-Sellr platform.</p>
                <p>Store Details:</p>
                <ul>
                    <li>Name: ${store_name}</li>
                    <li>Email: ${store_email}</li>
                    <li>Phone: ${store_phone}</li>
                    <li>Address: ${store_address}</li>
                </ul>
                <p>Documents Submitted:</p>
                <ul>
                    <li>CAC Document: ${documents.cac ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Utility Bill: ${documents.utility_bill ? 'Submitted' : 'Not Submitted'}</li>
                    <li>Tax Clearance: ${documents.tax_clearance ? 'Submitted' : 'Not Submitted'}</li>
                </ul>
                <p>Store Manager Default Password: ${defaultPassword}</p>
                <p>Please review the store's application and documents.</p>
                <p>Best regards,<br>Acces-Sellr System</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(colors.green(`Onboarding email sent to platform admin: ${adminEmail}`));
    } catch (error) {
        console.log(colors.red("Error sending onboarding email to platform admin: "), error);
        throw ResponseHelper.error(
            "Error sending onboarding email",
            error.message
        );
    }
}