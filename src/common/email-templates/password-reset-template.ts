export const passwordResetTemplate = (otp: string) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #0f172a;">Password Reset Request</h2>
      <p>We received a request to reset your password. Use the code below to proceed:</p>

      <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 5px solid #3b82f6;">
        <p style="font-size: 24px; font-weight: bold; color: #1e40af;">${otp}</p>
      </div>

      <p>This code is valid for <strong>5 minutes</strong>. If you didn’t request this, please ignore this email.</p>

      <p style="margin-top: 30px;">Best regards,<br><strong>PayFlex Support Team</strong></p>
    </div>
  `;
};
