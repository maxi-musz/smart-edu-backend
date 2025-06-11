export const loginOtpTemplate = (email: string, otp: string, otpExpiresAt: Date) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 20px;">Login Verification Code</h2>
        
        <p style="margin-bottom: 15px;">Hello,</p>
        
        <p style="margin-bottom: 15px;">We received a login request for your account (${email}). To complete your login, please use the verification code below:</p>

        <div style="margin: 25px 0; padding: 20px; background-color: #ffffff; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; margin: 0;">${otp}</p>
        </div>

        <p style="margin-bottom: 15px;">This code will expire at <strong>${otpExpiresAt.toLocaleTimeString()}</strong>.</p>

        <p style="margin-bottom: 15px;">If you didn't request this login, please ignore this email or contact support if you have concerns.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">Best regards,<br><strong>SmartEdu Support Team</strong></p>
        </div>
      </div>
    </div>
  `;
}; 