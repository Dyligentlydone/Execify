import { Settings, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

export default async function SettingsPage() {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
        return <div>Unauthorized</div>;
    }

    const org = await db.organization.findUnique({
        where: { id: user.organizationId },
        select: {
            plan: true,
            _count: {
                select: { members: true }
            }
        },
    });

    if (!org) return <div>Organization not found</div>;

    const currentPlan = org.plan ? PLANS[org.plan as keyof typeof PLANS] : PLANS.STARTER;
    const memberCount = org._count.members;
    const memberLimit = currentPlan.limits.teamMembers;
    const isLimitReached = memberCount >= memberLimit;
    const usagePercent = Math.min((memberCount / memberLimit) * 100, 100);

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your organization and account settings.
                </p>
            </div>

            {/* Team Usage Section */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Usage
                    </CardTitle>
                    <CardDescription>
                        You are on the {currentPlan.name} plan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Team Members</span>
                            <span className="font-medium">
                                {memberCount} / {memberLimit === Infinity ? "Unlimited" : memberLimit}
                            </span>
                        </div>
                        {memberLimit !== Infinity && (
                            <Progress value={usagePercent} className="h-2" />
                        )}
                    </div>

                    {isLimitReached && memberLimit !== Infinity && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Limit Reached</AlertTitle>
                            <AlertDescription>
                                You have reached the maximum number of team members for the {currentPlan.name} plan.
                                <Link href="/dashboard/settings/billing" className="font-bold underline ml-1">
                                    Upgrade to add more.
                                </Link>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="text-base">Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Organization Name</p>
                            <p className="text-sm text-muted-foreground">
                                Update your organization details
                            </p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Members</p>
                            <p className="text-sm text-muted-foreground">
                                Manage team members and their roles
                            </p>
                        </div>
                        {/* Clerk handles this via Organization Profile, usually mounted elsewhere or in a modal */}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Billing & Subscription</p>
                            <p className="text-sm text-muted-foreground">
                                Manage your plan and payment methods
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/settings/billing">
                                Manage
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="text-base">Integrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Stripe</p>
                            <p className="text-sm text-muted-foreground">
                                Connect your Stripe account for payment processing
                            </p>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Twilio</p>
                            <p className="text-sm text-muted-foreground">
                                Connect Twilio for SMS and communication
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
