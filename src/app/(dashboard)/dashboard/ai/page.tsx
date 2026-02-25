import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AIChatClient } from "@/components/ai/ai-chat-client";

export default async function AIPage() {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
        return <div>Unauthorized</div>;
    }

    const org = await db.organization.findUnique({
        where: { id: user.organizationId },
        select: { plan: true },
    });

    if (org?.plan === "FREE") {
        redirect("/dashboard");
    }

    const currentPlan = org?.plan ? PLANS[org.plan as keyof typeof PLANS] : PLANS.STARTER;
    const hasAccess = currentPlan.limits.aiAccess;

    if (!hasAccess) {
        return (
            <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-muted p-4">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">AI Assistant is a Pro Feature</h2>
                <p className="text-muted-foreground max-w-md text-center">
                    Upgrade your plan to unlock AI-powered insights, task generation, and automated workflows.
                </p>
                <Button className="gold-surface text-black border-0 hover:bg-[#cb9b51]" asChild>
                    <Link href="/dashboard/settings/billing">
                        Upgrade to Pro
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-10rem)] min-h-0 flex-col">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">AI Assistant</h2>
                <p className="text-muted-foreground mt-1">
                    Use natural language to manage your business operations.
                </p>
            </div>

            {/* Chat Interface */}
            <AIChatClient />
        </div>
    );
}
