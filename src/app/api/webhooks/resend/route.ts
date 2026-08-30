import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Resend webhook events:
// email.delivered, email.opened, email.clicked, email.bounced, email.complained
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ received: true });
    }

    const emailId = data.email_id || data.id;

    // Find the email track record by trackingId (which stores the Resend email ID)
    const emailTrack = await prisma.emailTrack.findFirst({
      where: { trackingId: emailId },
    });

    if (!emailTrack) {
      // No matching record — might be from before tracking was set up
      return NextResponse.json({ received: true });
    }

    const now = new Date();

    switch (type) {
      case "email.delivered":
        // Mark application as delivered
        await prisma.application.updateMany({
          where: { id: emailTrack.applicationId },
          data: { status: "SENT" },
        });
        break;

      case "email.opened":
        await prisma.emailTrack.update({
          where: { id: emailTrack.id },
          data: {
            openedAt: emailTrack.openedAt || now,
            openCount: { increment: 1 },
          },
        });
        // Update application status
        await prisma.application.updateMany({
          where: { id: emailTrack.applicationId, status: "SENT" },
          data: { status: "VIEWED" },
        });
        console.log(`📧 Email opened: ${emailTrack.recipientEmail}`);
        break;

      case "email.clicked":
        await prisma.emailTrack.update({
          where: { id: emailTrack.id },
          data: {
            clickedAt: emailTrack.clickedAt || now,
            clickCount: { increment: 1 },
          },
        });
        // Update application status
        await prisma.application.updateMany({
          where: { id: emailTrack.applicationId, status: { in: ["SENT", "VIEWED"] } },
          data: { status: "VIEWED" },
        });
        console.log(`🖱️ Email clicked: ${emailTrack.recipientEmail}`);
        break;

      case "email.bounced":
        console.log(`⚠️ Email bounced: ${emailTrack.recipientEmail}`);
        break;

      case "email.complained":
        console.log(`🚫 Email complained (spam): ${emailTrack.recipientEmail}`);
        break;

      default:
        // Unknown event type — just acknowledge
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Resend webhook error:", error);
    // Always return 200 to prevent Resend from retrying
    return NextResponse.json({ received: true });
  }
}

// Resend requires a GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok", service: "JobSwipe Resend Webhook" });
}
