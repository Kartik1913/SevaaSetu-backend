const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const frontendUrl = process.env.FRONTEND_URL || "https://sevaasetu.in";
  const supportEmail = "support@sevaasetu.in";
  const instagramUrl = "https://instagram.com/sevaasetu2026";

  // Standard Footer Component
  const footerHtml = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; font-family: sans-serif;">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <img src="${frontendUrl}/logo.png" alt="SevaaSetu" width="30" height="30" style="border-radius: 50%; margin-right: 10px;">
        <span style="font-weight: bold; font-size: 16px; color: #1a365d;">Sevaa<span style="color: #FF9933;">Setu</span></span>
      </div>
      
      <p style="margin: 5px 0;">Connecting intent with impact. A bridge between NGOs and volunteers for a better India.</p>
      
      <div style="margin: 15px 0;">
        <a href="${frontendUrl}" style="color: #FF9933; text-decoration: none; margin-right: 15px;">Website</a>
        <a href="${instagramUrl}" style="color: #FF9933; text-decoration: none; margin-right: 15px;">Instagram</a>
        <a href="mailto:${supportEmail}" style="color: #FF9933; text-decoration: none;">Support</a>
      </div>
      
      <p style="margin: 20px 0 0; color: #999;">
        Made with ❤️ for Bharat<br>
        © ${new Date().getFullYear()} SevaaSetu. All rights reserved.
      </p>
    </div>
  `;

  const footerText = `\n\n---\nSevaaSetu - Connecting intent with impact\nWebsite: ${frontendUrl}\nInstagram: ${instagramUrl}\nSupport: ${supportEmail}\nMade with Heart for Bharat`;

  // Create a transporter using Hostinger SMTP credentials from .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT, // Usually 465 or 587
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  });

  const message = {
    from: `${process.env.FROM_NAME || "SevaaSetu"} <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message + footerText,
    html: options.html
      ? `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          ${options.html}
          ${footerHtml}
        </div>`
      : undefined,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
