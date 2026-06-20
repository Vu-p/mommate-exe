import nodemailer from 'nodemailer';

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    })
  : null;

export const sendEmail = async (to: string, subject: string, text: string) => {
  if (!transporter) return { skipped: true };
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'MomMate <no-reply@mommate.vn>',
    to,
    subject,
    text,
  });
  return { skipped: false };
};
