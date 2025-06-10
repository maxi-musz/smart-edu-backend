// email-templates.ts

export const onboardingMailTemplate = (payload: {
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
    defaultPassword?: string
  }): string => {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <div style="padding: 20px; border-bottom: 1px solid #eee; background-color: #4f46e5; color: white;">
            <h2>Welcome to Smart Edu Hub 🎉</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hello <strong>${payload.school_name}</strong>,</p>
            <p>Your school has been successfully onboarded. Below are your onboarding details:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td><strong>Email</strong></td>
                <td>${payload.school_email}</td>
              </tr>
              <tr>
                <td><strong>Phone</strong></td>
                <td>${payload.school_phone}</td>
              </tr>
              <tr>
                <td><strong>Address</strong></td>
                <td>${payload.school_address}</td>
              </tr>
              <tr>
                <td><strong>Type</strong></td>
                <td>${payload.school_type}</td>
              </tr>
              <tr>
                <td><strong>Ownership</strong></td>
                <td>${payload.school_ownership}</td>
              </tr>
            </table>
  
            <p style="margin-top: 20px;"><strong>Uploaded Documents:</strong></p>
            <ul>
              <li>CAC: ${payload.documents.cac || "Not provided"}</li>
              <li>Utility Bill: ${payload.documents.utility_bill || "Not provided"}</li>
              <li>Tax Clearance: ${payload.documents.tax_clearance || "Not provided"}</li>
            </ul>
  
            <p style="margin-top: 20px;">Your details are now awaiting approval, kindly wait for some hours while our support team verifies your document. Upon successful verification you will be send your credwentials to access the platform.</p>
            <p>We’re excited to have you onboard 🚀</p>
            <p>— Smart Edu Hub Team</p>
          </div>
          <div style="padding: 20px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #666;">
            &copy; ${new Date().getFullYear()} Smart Edu Hub. All rights reserved.
          </div>
        </div>
      </div>
    `;
  };
  