import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "Gmail", // or use "Resend", "SendGrid"
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate HTML email template
function generateOTPEmailHTML(otp: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - AgentSync</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .header-subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .message {
          font-size: 16px;
          margin-bottom: 30px;
          color: #6b7280;
          line-height: 1.7;
        }
        .otp-container {
          background-color: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-label {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #1f2937;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: inline-block;
          margin: 10px 0;
        }
        .expiry-info {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .expiry-text {
          color: #92400e;
          font-weight: 500;
          font-size: 14px;
        }
        .security-notice {
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }
        .security-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        .security-icon {
          margin-right: 8px;
        }
        .security-text {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
        }
        .company-name {
          font-weight: 600;
          color: #6366f1;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding: 30px 20px;
          }
          .otp-code {
            font-size: 28px;
            letter-spacing: 4px;
            padding: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 AgentSync</div>
          <div class="header-subtitle">Secure Email Verification</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hello!</div>
          
          <div class="message">
            We received a request to verify your email address. To complete the verification process, please use the verification code below:
          </div>
          
          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
          </div>
          
          <div class="expiry-info">
            <div class="expiry-text">
              ⏰ This code will expire in 5 minutes for your security.
            </div>
          </div>
          
          <div class="security-notice">
            <div class="security-title">
              <span class="security-icon">🔒</span>
              Security Notice
            </div>
            <div class="security-text">
              • Never share this code with anyone<br>
              • AgentSync will never ask for this code via phone or email<br>
              • If you didn't request this verification, please ignore this email
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            This email was sent by <span class="company-name">AgentSync</span><br>
            If you have any questions, please contact our support team.<br><br>
            <em>This is an automated email, please do not reply.</em>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text fallback
function generateOTPEmailText(otp: string): string {
  return `
Email Verification - AgentSync

Hello!

We received a request to verify your email address. To complete the verification process, please use the verification code below:

YOUR VERIFICATION CODE: ${otp}

⏰ This code will expire in 5 minutes for your security.

SECURITY NOTICE:
• Never share this code with anyone
• AgentSync will never ask for this code via phone or email
• If you didn't request this verification, please ignore this email

---
This email was sent by AgentSync.
If you have any questions, please contact our support team.

This is an automated email, please do not reply.
  `.trim();
}

export async function sendOTP(email: string, otp: string) {
  const mailOptions = {
    from: {
      name: "AgentSync",
      address: process.env.EMAIL_USER!,
    },
    to: email,
    subject: `🔐 Your AgentSync Verification Code: ${otp}`,
    text: generateOTPEmailText(otp),
    html: generateOTPEmailHTML(otp),
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      Importance: "high",
    },
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}
