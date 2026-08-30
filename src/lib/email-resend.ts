import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — email will use SMTP fallback");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

// ---- Rate limiting (in-memory, per-user, per-hour) ----
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max emails per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(email: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_WINDOW });
    return { ok: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: RATE_LIMIT - entry.count };
}

// ---- Professional email HTML template ----
function buildApplicationEmailHtml(opts: {
  userName: string;
  userEmail: string;
  jobTitle: string;
  companyName: string;
  coverLetter: string;
  resumeUrl?: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:600;">
        Application for ${opts.jobTitle}
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;color:#1e293b;line-height:1.7;">
      <p style="margin:0 0 16px 0;">Dear Hiring Manager,</p>

      <div style="margin:0 0 24px 0;white-space:pre-wrap;">${opts.coverLetter}</div>

      <p style="margin:0 0 8px 0;">
        I would welcome the opportunity to discuss how my skills and experience
        align with ${opts.companyName}'s needs.
      </p>

      ${opts.resumeUrl ? `<p style="margin:0 0 8px 0;">
        📎 <a href="${opts.resumeUrl}" style="color:#6366f1;">View my resume</a>
      </p>` : ""}

      <p style="margin:24px 0 0 0;">
        Best regards,<br>
        <strong>${opts.userName}</strong><br>
        <span style="color:#64748b;font-size:13px;">${opts.userEmail}</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f1f5f9;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        Sent via JobSwipe AI — AI-Powered Job Applications
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ---- Main send function ----
export interface SendApplicationEmailOptions {
  fromName: string;
  fromEmail: string; // user's email (for reply-to)
  toEmail: string;   // recruiter email
  jobTitle: string;
  companyName: string;
  coverLetter: string;
  resumeUrl?: string;
  resumeBuffer?: Buffer;
  resumeFileName?: string;
}

export interface SendResult {
  success: boolean;
  emailId?: string;
  provider: "resend" | "smtp";
  error?: string;
  remaining?: number;
}

export async function sendApplicationEmailResend(
  opts: SendApplicationEmailOptions
): Promise<SendResult> {
  // Rate limit check
  const rateLimit = checkRateLimit(opts.fromEmail);
  if (!rateLimit.ok) {
    return {
      success: false,
      provider: "resend",
      error: "Rate limit exceeded. Maximum 10 applications per hour. Try again later.",
      remaining: 0,
    };
  }

  // Determine sender — use Resend free domain if custom domain not verified
  const customDomain = process.env.EMAIL_SENDING_DOMAIN;
  let fromAddress: string;
  if (customDomain && customDomain !== "resend.dev") {
    fromAddress = `${opts.fromName} <applications@${customDomain}>`;
  } else {
    // Use Resend free domain — works immediately, no DNS setup needed
    fromAddress = `${opts.fromName} via JobSwipe <onboarding@resend.dev>`;
  }

  // Try Resend first
  const resend = getResend();
  if (resend) {
    try {
      const emailHtml = buildApplicationEmailHtml({
        userName: opts.fromName,
        userEmail: opts.fromEmail,
        jobTitle: opts.jobTitle,
        companyName: opts.companyName,
        coverLetter: opts.coverLetter,
        resumeUrl: opts.resumeUrl,
      });

      const result = await resend.emails.send({
        from: fromAddress,
        to: opts.toEmail,
        replyTo: opts.fromEmail, // Replies go directly to user
        subject: `Application for ${opts.jobTitle} — ${opts.fromName}`,
        html: emailHtml,
        headers: {
          "X-Entity-Ref-ID": `jobswipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
        tags: [
          { name: "category", value: "job_application" },
          { name: "company", value: opts.companyName },
        ],
        attachments: opts.resumeBuffer
          ? [
              {
                filename: opts.resumeFileName || `${opts.fromName.replace(/\s+/g, "_")}_Resume.pdf`,
                content: opts.resumeBuffer.toString("base64"),
              },
            ]
          : undefined,
      });

      if (result.error) {
        console.error("Resend error:", result.error);
        // Fall through to SMTP fallback
      } else {
        console.log(`✅ Resend email sent to ${opts.toEmail} for ${opts.jobTitle} at ${opts.companyName}`);
        return {
          success: true,
          emailId: result.data?.id,
          provider: "resend",
          remaining: rateLimit.remaining,
        };
      }
    } catch (err: any) {
      console.error("Resend send failed:", err.message);
      // Fall through to SMTP fallback
    }
  }

  // SMTP fallback (existing Nodemailer setup)
  try {
    const { sendEmail } = await import("@/lib/email");
    const htmlBody = buildApplicationEmailHtml({
      userName: opts.fromName,
      userEmail: opts.fromEmail,
      jobTitle: opts.jobTitle,
      companyName: opts.companyName,
      coverLetter: opts.coverLetter,
      resumeUrl: opts.resumeUrl,
    });

    const sent = await sendEmail({
      to: opts.toEmail,
      subject: `Application for ${opts.jobTitle} — ${opts.fromName}`,
      html: htmlBody,
      replyTo: opts.fromEmail,
      attachments: opts.resumeBuffer
        ? [
            {
              filename: opts.resumeFileName || `${opts.fromName.replace(/\s+/g, "_")}_Resume.pdf`,
              content: opts.resumeBuffer,
              contentType: "application/pdf",
            },
          ]
        : undefined,
    });

    if (sent) {
      console.log(`✅ SMTP email sent to ${opts.toEmail} for ${opts.jobTitle}`);
      return { success: true, provider: "smtp", remaining: rateLimit.remaining };
    }
  } catch (err: any) {
    console.error("SMTP fallback failed:", err.message);
  }

  return {
    success: false,
    provider: resend ? "resend" : "smtp",
    error: "Email sending failed. Please check your email configuration.",
    remaining: rateLimit.remaining,
  };
}

// ---- Recruiter email finder ----
export function findRecruiterEmail(jobDescription: string, company: string): string | null {
  // Try to extract email from job description
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/gi;
  const emails = jobDescription.match(emailRegex);

  if (emails && emails.length > 0) {
    // Filter out common fake/generated emails
    const realEmails = emails.filter(
      (e) =>
        !e.includes("example.com") &&
        !e.includes("email.com") &&
        !e.includes("test.com") &&
        !e.includes("sentry.io") &&
        !e.includes("github.com")
    );
    if (realEmails.length > 0) return realEmails[0];
  }

  // Generate likely HR email patterns
  const cleanCompany = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const patterns = [
    `careers@${cleanCompany}.com`,
    `hr@${cleanCompany}.com`,
    `jobs@${cleanCompany}.com`,
    `recruiting@${cleanCompany}.com`,
  ];

  return patterns[0]; // Return the most common pattern
}

// ---- Email verification status check ----
export async function isDomainVerified(): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    const domain = process.env.EMAIL_SENDING_DOMAIN || "jobswipe.in";
    const { data, error } = await resend.domains.get(domain);
    if (error) return false;
    return data?.status === "verified";
  } catch {
    return false;
  }
}
