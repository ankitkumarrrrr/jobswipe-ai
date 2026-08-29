import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// Auto-apply to jobs on LinkedIn, Indeed, etc.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { jobId, platform, resumeText, coverLetter, linkedinUrl } = await req.json();

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const user = await prisma.user.findFirst({ where: { id: sessionToken }, include: { profile: true, resume: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check subscription
    const sub = await prisma.subscription.findFirst({ where: { userId: sessionToken } });
    if (sub && sub.applicationsLimit !== -1 && sub.applicationsUsed >= sub.applicationsLimit) {
      return NextResponse.json({ error: 'Application limit reached. Upgrade your plan.' }, { status: 403 });
    }

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    let result = { success: false, message: '', platform: platform || 'linkedin' };

    try {
      const page = await browser.newPage();

      if (platform === 'linkedin' && job.url.includes('linkedin.com')) {
        // LinkedIn Easy Apply
        await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        const easyApplyBtn = await page.$('button[aria-label*="Easy Apply"], button.jobs-apply-button, .jobs-apply-button');
        if (easyApplyBtn) {
          await easyApplyBtn.click();
          await page.waitForTimeout(2000);

          // Try to fill form
          const inputs = await page.$$('input[type="text"], input[type="email"], textarea');
          for (const input of inputs) {
            const placeholder = await input.getAttribute('placeholder') || '';
            const label = await input.getAttribute('aria-label') || '';

            if (placeholder.toLowerCase().includes('email') || label.toLowerCase().includes('email')) {
              await input.fill(user.email);
            } else if (placeholder.toLowerCase().includes('phone') || label.toLowerCase().includes('phone')) {
              await input.fill(user.profile?.phone || '');
            } else if (placeholder.toLowerCase().includes('linkedin') || label.toLowerCase().includes('linkedin')) {
              await input.fill(user.profile?.linkedinUrl || '');
            }
          }

          // Click submit
          const submitBtn = await page.$('button[aria-label*="Submit"], button[aria-label*="submit application"], .jobs-easy-apply-modal__footer-btn');
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
            result = { success: true, message: 'Applied via LinkedIn Easy Apply', platform: 'linkedin' };
          } else {
            result = { success: false, message: 'Found Easy Apply but could not submit form', platform: 'linkedin' };
          }
        } else {
          result = { success: false, message: 'No Easy Apply button found. Apply manually.', platform: 'linkedin' };
        }
      } else if (platform === 'indeed' && job.url.includes('indeed.com')) {
        await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        const applyBtn = await page.$('button#indeedApplyButton, .indeed-apply-button, button[data-apply-url]');
        if (applyBtn) {
          await applyBtn.click();
          await page.waitForTimeout(3000);
          result = { success: true, message: 'Indeed apply initiated', platform: 'indeed' };
        } else {
          result = { success: false, message: 'No apply button found. Apply manually.', platform: 'indeed' };
        }
      } else {
        result = { success: false, message: 'Platform not supported for auto-apply. Use manual apply.', platform: platform || 'unknown' };
      }
    } catch (e: any) {
      result = { success: false, message: `Auto-apply error: ${e.message}`, platform: platform || 'unknown' };
    } finally {
      await browser.close();
    }

    // Create application record
    const application = await prisma.application.create({
      data: {
        userId: sessionToken,
        jobId,
        status: result.success ? 'SENT' : 'MANUAL_REQUIRED',
        customizedResume: resumeText,
        coverLetter,
        emailBody: `Auto-apply ${result.success ? 'successful' : 'requires manual action'}`,
        sentAt: result.success ? new Date() : null,
      },
    });

    // Update subscription usage
    if (result.success) {
      await prisma.subscription.updateMany({
        where: { userId: sessionToken },
        data: { applicationsUsed: { increment: 1 } },
      });
    }

    return NextResponse.json({ ...result, applicationId: application.id });
  } catch (error) {
    console.error('Auto-apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
