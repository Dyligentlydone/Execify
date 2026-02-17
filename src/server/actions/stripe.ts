"use server";

import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function createStripeCheckoutSession(priceId: string) {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
        throw new Error("Unauthorized");
    }

    // Get the organization to check for existing customer ID
    const org = await db.organization.findUnique({
        where: { id: user.organizationId },
    });

    if (!org) {
        throw new Error("Organization not found");
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

    try {
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer: org.stripeCustomerId || undefined, // Use existing customer if exists
            customer_email: org.stripeCustomerId ? undefined : user.email, // Pre-fill email if new customer
            metadata: {
                organizationId: org.id,
                userId: user.id,
            },
            success_url: `${returnUrl}?success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
            subscription_data: {
                metadata: {
                    organizationId: org.id,
                },
            },
            allow_promotion_codes: true,
        });

        if (!session.url) {
            throw new Error("Failed to create checkout session");
        }

        return session.url;
    } catch (error) {
        console.error("Error creating checkout session:", error);
        throw new Error("Failed to create checkout session");
    }
}
