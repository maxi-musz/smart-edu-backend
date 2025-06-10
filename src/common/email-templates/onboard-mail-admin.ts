// mail/email-templates.ts

export const onboardingSchoolAdminNotificationTemplate = (payload: {
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
    defaultPassword: string | null
  }) => {
    return `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #0f172a;">📥 New School Onboarding Notification</h2>
        <p>A new school has just onboarded on the platform. Here are the details:</p>
  
        <ul>
          <li><strong>School Name:</strong> ${payload.school_name}</li>
          <li><strong>Email:</strong> ${payload.school_email}</li>
          <li><strong>Phone:</strong> ${payload.school_phone}</li>
          <li><strong>Address:</strong> ${payload.school_address}</li>
          <li><strong>Type:</strong> ${payload.school_type}</li>
          <li><strong>Ownership:</strong> ${payload.school_ownership}</li>
          <li><strong>Password:</strong> ${payload.defaultPassword}</li>
        </ul>
  
        <h3 style="margin-top: 20px;">📄 Uploaded Documents</h3>
        <ul>
          <li><strong>CAC:</strong> ${payload.documents.cac ? `<a href="${payload.documents.cac}">View</a>` : 'Not provided'}</li>
          <li><strong>Utility Bill:</strong> ${payload.documents.utility_bill ? `<a href="${payload.documents.utility_bill}">View</a>` : 'Not provided'}</li>
          <li><strong>Tax Clearance:</strong> ${payload.documents.tax_clearance ? `<a href="${payload.documents.tax_clearance}">View</a>` : 'Not provided'}</li>
        </ul>
  
        <p style="margin-top: 30px;">🚀 Time to review and approve the new registration.</p>
      </div>
    `;
  };
  