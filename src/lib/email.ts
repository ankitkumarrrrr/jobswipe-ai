import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP credentials not configured");
    }
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: (process.env.SMTP_PASS || "").replace(/\s/g, ""),
      },
    });
  }
  return _transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "JobSwipe"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

/**
 * Send application email FROM the user TO the recruiter.
 * The email appears to come from the user's own email address.
 * Resume is attached as PDF.
 */
export async function sendApplicationEmail(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string,
  applicantName: string,
  applicantEmail: string,
  resumeBuffer?: Buffer
): Promise<boolean> {
  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="padding: 24px; background: #fff;">
        <p style="white-space: pre-wrap; line-height: 1.6;">${body.replace(/\n/g, "<br>")}</p>
      </div>
      <div style="padding: 12px 24px; background: #f9fafb; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        <p>Sent via JobSwipe AI — AI-Powered Job Applications</p>
      </div>
    </div>
  `;

  const attachments = resumeBuffer
    ? [
        {
          filename: `${applicantName.replace(/\s+/g, "_")}_Resume.pdf`,
          content: resumeBuffer,
          contentType: "application/pdf",
        },
      ]
    : undefined;

  return sendEmail({
    to: recipientEmail,
    subject,
    html: htmlBody,
    replyTo: applicantEmail, // Replies go to the USER, not JobSwipe
    attachments,
  });
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
