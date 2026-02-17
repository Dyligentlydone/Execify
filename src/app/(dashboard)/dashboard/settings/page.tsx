import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your organization and account settings.
                </p>
            </div>

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
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Billing & Subscription</p>
                            <p className="text-sm text-muted-foreground">
                                Manage your plan and payment methods
                            </p>
                        </div>
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
