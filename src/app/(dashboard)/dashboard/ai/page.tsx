import { Bot, Send, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import Link from "next/link";

export default async function AIPage() {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
        return <div>Unauthorized</div>;
    }

    const org = await db.organization.findUnique({
        where: { id: user.organizationId },
        select: { plan: true },
    });

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
        <div className="flex h-[calc(100vh-10rem)] flex-col">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">AI Assistant</h2>
                <p className="text-muted-foreground mt-1">
                    Use natural language to manage your business operations.
                </p>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 border-border/50 flex flex-col overflow-hidden">
                <div className="flex-1 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="text-center space-y-6 max-w-lg z-10">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping duration-[3000ms]" />
                            <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse duration-[2000ms]" />
                            <div className="relative bg-gradient-to-br from-[#462523] to-[#cb9b51] rounded-full w-24 h-24 flex items-center justify-center shadow-xl border border-amber-500/30">
                                <Sparkles className="h-10 w-10 text-white animate-pulse" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold tracking-tight">How can I help you today?</h2>
                            <p className="text-muted-foreground">
                                Try asking about "Q3 Revenue" or "Top Performing Clients"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask Execuaide AI anything..."
                            className="flex-1 bg-muted/50 border-none"
                        />
                        <Button
                            size="icon"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
