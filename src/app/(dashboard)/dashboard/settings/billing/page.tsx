import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { redirect } from "next/navigation";

export default async function BillingPage() {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
        redirect("/sign-in");
    }

    const org = await db.organization.findUnique({
        where: { id: user.organizationId },
        select: {
            plan: true,
            stripeSubscriptionId: true,
        },
    });

    if (!org) {
        return <div>Organization not found</div>;
    }

    const currentPlanKey = org.plan || "STARTER";

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your plan and payment details.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {Object.entries(PLANS).map(([key, plan]) => {
                    const isCurrent = currentPlanKey === key;

                    return (
                        <Card key={key} className={`flex flex-col ${isCurrent ? 'border-amber-500/50 shadow-md shadow-amber-500/10' : ''}`}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{plan.name}</CardTitle>
                                    {isCurrent && (
                                        <Badge variant="outline" className="border-amber-500 text-amber-500">
                                            Current
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>
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
                                <UpgradeButton
                                    priceId={plan.priceId}
                                    current={isCurrent}
                                />
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
