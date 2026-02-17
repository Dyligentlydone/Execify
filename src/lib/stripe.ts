import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "dummy_key_for_build", {
    apiVersion: "2026-01-28.clover",
    typescript: true,
});

export const PLANS = {
    STARTER: {
        name: "Starter",
        priceId: process.env.STRIPE_STARTER_PRICE_ID!,
        limits: {
            teamMembers: 5,
            contacts: 500,
            aiAccess: false,
        },
        features: [
            "Up to 5 team members",
            "500 contacts",
            "Basic CRM",
            "Task management",
            "Invoice tracking",
        ],
    },
    PRO: {
        name: "Pro",
        priceId: process.env.STRIPE_PRO_PRICE_ID!,
        limits: {
            teamMembers: 25,
            contacts: Infinity,
            aiAccess: true,
        },
        features: [
            "Up to 25 team members",
            "Unlimited contacts",
            "Full CRM & pipeline",
            "AI assistant",
            "Custom dashboards",
            "Email integrations",
        ],
    },
    EXECUTIVE: {
        name: "Executive",
        priceId: process.env.STRIPE_EXECUTIVE_PRICE_ID!,
        limits: {
            teamMembers: Infinity,
            contacts: Infinity,
            aiAccess: true,
        },
        features: [
            "Unlimited team members",
            "Unlimited contacts",
            "Full CRM & pipeline",
            "Advanced AI assistant",
            "Custom dashboards",
            "All integrations",
            "Priority support",
            "Custom branding",
        ],
    },
} as const;
