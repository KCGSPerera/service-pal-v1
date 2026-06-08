import nodemailer from 'nodemailer';

// Create a transporter using environment variables if available, otherwise fallback to Ethereal test account
let transporterPromise = (async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Create a test account (only once)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
})();

/**
 * Send an email using the configured transporter.
 * In development the email is sent to an Ethereal inbox and a preview URL is logged.
 * @param {string} to Recipient email address
 * @param {string} subject Email subject line
 * @param {string} html HTML body content
 */
export async function sendMail(to, subject, html) {
  const transporter = await transporterPromise;
  const info = await transporter.sendMail({
    from: '"Service-Pal" <no-reply@service-pal.com>',
    to,
    subject,
    html,
  });
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
}
