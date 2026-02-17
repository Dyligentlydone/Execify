import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "hello@execify.com";

type SendEmailOptions = {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: `Execify <${FROM_EMAIL}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            text,
        });

        if (error) {
            console.error("[Email] Failed to send:", error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error("[Email] Error:", err);
        throw err;
    }
}

// ──────────────────────────────
// Email template helpers
// ──────────────────────────────

export async function sendWelcomeEmail(email: string, firstName: string) {
    return sendEmail({
        to: email,
        subject: "Welcome to Execify 🚀",
        html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #18181b;">Welcome to Execify, ${firstName}!</h1>
        <p style="color: #52525b; line-height: 1.6;">
          Your AI-powered business command center is ready. Start by setting up your
          organization and inviting your team.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display: inline-block; background: #18181b; color: #fafafa;
                  padding: 12px 24px; border-radius: 8px; text-decoration: none;
                  margin-top: 16px;">
          Go to Dashboard →
        </a>
      </div>
    `,
    });
}

export async function sendOrgInviteEmail(
    email: string,
    orgName: string,
    inviterName: string
) {
    return sendEmail({
        to: email,
        subject: `You've been invited to ${orgName} on Execify`,
        html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #18181b;">You're invited!</h1>
        <p style="color: #52525b; line-height: 1.6;">
          ${inviterName} has invited you to join <strong>${orgName}</strong> on Execify.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-up"
           style="display: inline-block; background: #18181b; color: #fafafa;
                  padding: 12px 24px; border-radius: 8px; text-decoration: none;
                  margin-top: 16px;">
          Accept Invitation →
        </a>
      </div>
    `,
    });
}

export async function sendInvoiceReceiptEmail(
    email: string,
    invoiceNumber: string,
    total: string,
    currency: string
) {
    return sendEmail({
        to: email,
        subject: `Invoice ${invoiceNumber} — Receipt`,
        html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #18181b;">Invoice Receipt</h1>
        <p style="color: #52525b; line-height: 1.6;">
          Invoice <strong>${invoiceNumber}</strong> has been paid.
        </p>
        <p style="font-size: 24px; font-weight: bold; color: #18181b;">
          ${currency} ${total}
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices"
           style="display: inline-block; background: #18181b; color: #fafafa;
                  padding: 12px 24px; border-radius: 8px; text-decoration: none;
                  margin-top: 16px;">
          View Invoice →
        </a>
      </div>
    `,
    });
}

export async function sendSubscriptionUpdateEmail(
    email: string,
    planName: string
) {
    return sendEmail({
        to: email,
        subject: `Your Execify plan has been updated`,
        html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #18181b;">Plan Updated</h1>
        <p style="color: #52525b; line-height: 1.6;">
          Your subscription has been updated to the <strong>${planName}</strong> plan.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings"
           style="display: inline-block; background: #18181b; color: #fafafa;
                  padding: 12px 24px; border-radius: 8px; text-decoration: none;
                  margin-top: 16px;">
          View Settings →
        </a>
      </div>
    `,
    });
}

export async function sendPaymentFailedEmail(email: string) {
    return sendEmail({
        to: email,
        subject: "Action required: Payment failed",
        html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Payment Failed</h1>
        <p style="color: #52525b; line-height: 1.6;">
          We were unable to process your payment. Please update your payment method
          to avoid service interruption.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings"
           style="display: inline-block; background: #dc2626; color: #fafafa;
                  padding: 12px 24px; border-radius: 8px; text-decoration: none;
                  margin-top: 16px;">
          Update Payment Method →
        </a>
      </div>
    `,
    });
}
