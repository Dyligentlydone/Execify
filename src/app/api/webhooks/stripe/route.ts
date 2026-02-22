import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
    sendSubscriptionUpdateEmail,
    sendPaymentFailedEmail,
} from "@/lib/email";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Plan } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const body = await req.text();
    const headerPayload = await headers();
    const signature = headerPayload.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("[Stripe Webhook] Verification failed:", err);
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const orgId = session.metadata?.organizationId;

                if (orgId && session.subscription) {
                    await db.organization.update({
                        where: { id: orgId },
                        data: {
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: session.subscription as string,
                        },
                    });
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object;
                const org = await db.organization.findUnique({
                    where: { stripeSubscriptionId: subscription.id },
                    include: {
                        members: {
                            where: { role: { in: ["OWNER", "ADMIN"] } },
                            include: { user: true },
                        },
                    },
                });

                if (org) {
                    const priceId = subscription.items.data[0]?.price.id;
                    const plan = getPlanFromPriceId(priceId);

                    await db.organization.update({
                        where: { id: org.id },
                        data: { plan },
                    });

                    // Notify org owner
                    const owner = org.members[0]?.user;
                    if (owner) {
                        await sendSubscriptionUpdateEmail(owner.email, plan).catch(
                            (err) =>
                                console.error("[Stripe Webhook] Sub update email failed:", err)
                        );
                    }
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object;
                const customerId = invoice.customer as string;

                const org = await db.organization.findUnique({
                    where: { stripeCustomerId: customerId },
                    include: {
                        members: {
                            where: { role: { in: ["OWNER", "ADMIN"] } },
                            include: { user: true },
                        },
                    },
                });

                if (org) {
                    const owner = org.members[0]?.user;
                    if (owner) {
                        await sendPaymentFailedEmail(owner.email).catch((err) =>
                            console.error(
                                "[Stripe Webhook] Payment failed email error:",
                                err
                            )
                        );
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                await db.organization.update({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        plan: "FREE",
                        stripeSubscriptionId: null,
                    },
                });
                break;
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
        }
    } catch (error) {
        console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }

    return NextResponse.json({ received: true });
}

function getPlanFromPriceId(priceId: string): Plan {
    if (priceId === process.env.STRIPE_EXECUTIVE_PRICE_ID) return "EXECUTIVE";
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
    return "STARTER";
}
