import { PLANS } from "@/lib/stripe";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export default async function SubscribePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Double check if they already have a subscription to avoid getting stuck here
    if (user.organizationId) {
        const org = await db.organization.findUnique({
            where: { id: user.organizationId },
            select: { stripeSubscriptionId: true }
        });

        if (org?.stripeSubscriptionId) {
            redirect("/dashboard");
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
            {/* Escape Hatch Header */}
            <div className="absolute top-4 right-4 flex items-center gap-4">
                <OrganizationSwitcher
                    hidePersonal
                    afterCreateOrganizationUrl="/onboarding"
                    afterLeaveOrganizationUrl="/dashboard"
                    afterSelectOrganizationUrl="/dashboard"
                    appearance={{
                        elements: {
                            rootBox: "flex justify-center items-center",
                        }
                    }}
                />
                <UserButton afterSignOutUrl="/sign-in" />
            </div>

            <div className="max-w-5xl w-full space-y-8 mt-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        Complete Your Setup
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        To access your Execufy dashboard, please select a subscription plan.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {Object.entries(PLANS).map(([key, plan]) => (
                        <Card key={key} className="flex flex-col border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-2xl font-bold">{plan.price}</span>
                                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                                </div>
                                <CardDescription className="mt-2">
                                    {key === "STARTER" ? "Essential tools for small teams" :
                                        key === "PRO" ? "Advanced features for growing businesses" :
                                            "Complete power for large organizations"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2 text-sm">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <UpgradeButton priceId={plan.priceId} />
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Secure payment processing by Stripe. You can cancel at any time.
                    </p>
                </div>
            </div>
        </div>
    );
}
