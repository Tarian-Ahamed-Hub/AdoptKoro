
const nodemailer = require('nodemailer');

const gmailTransporter = nodemailer.createTransport({
  host: process.env.HOSTINGER_HOST,
  port: parseInt(process.env.HOSTINGER_PORT),
  secure: process.env.HOSTINGER_SECURE === 'true',
  auth: {
    user: process.env.HOSTINGER_USER,
    pass: process.env.HOSTINGER_PASS
  },
  family: 4,
  tls: {
    rejectUnauthorized: false 
  }
});

const sendOTPEmail = async (email, otp, type) => {
  try {
    // Validation
    if (!email || !otp || !type) {
      throw new Error('Email, OTP, and type are required');
    }

    const typeMessages = {
      registration: {
        subject: 'Email Verification - Complete Your Registration',
        intro: 'You are registering a new account'
      },
      login: {
        subject: 'Login Verification - One Time Password',
        intro: 'You are attempting to login'
      },
      forgot_password: {
        subject: 'Password Reset - One Time Password',
        intro: 'You requested to reset your password'
      }
    };

    const typeInfo = typeMessages[type] || typeMessages.registration;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .intro { color: #555; font-size: 16px; margin-bottom: 20px; line-height: 1.6; }
          .otp-box { background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 20px; margin: 20px 0; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; color: #3498db; letter-spacing: 5px; font-family: 'Courier New', monospace; }
          .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; padding: 15px; background-color: #fff5f5; border-radius: 4px; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #ddd; }
          .divider { border: 0; border-top: 1px solid #ddd; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Email Verification</h1></div>
          <div class="content">
            <p class="intro">${typeInfo.intro}.</p>
            <p>Your One Time Password (OTP) is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p style="color: #555; font-size: 14px;">
              This OTP will expire in <strong>5 minutes</strong>. Please do not share this code with anyone.
            </p>
            <hr class="divider">
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you did not request this code, please ignore this email or contact support immediately.
            </div>
          </div>
          <div class="footer">
            <p>© 2024 FixHero Global. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    
      try {
        // ==================== Hostinger SMTP ====================
        const mailOptions = {
          from: `<${process.env.HOSTINGER_USER}>`,
          to: email,
          subject: typeInfo.subject,
          html: htmlContent
        };

        await gmailTransporter.sendMail(mailOptions);
        
        console.log("✅ OTP email sent successfully via Hostinger SMTP");
        return { 
          success: true, 
          message: 'OTP email sent successfully',
          provider: 'Hostinger SMTP'
        };
      } catch (smtpError) {
        console.error('❌ SMTP Error:', smtpError.message);
        throw new Error(`SMTP failed: ${smtpError.message}`);
      }
   
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to send OTP email',
      timestamp: new Date().toISOString()
    };
  }
};


module.exports = {
  sendOTPEmail,
  transporter: gmailTransporter
};