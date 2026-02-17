import { Bot, Send, Lock } from "lucide-react";
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
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 mb-4">
                        <Bot className="h-12 w-12 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">
                        Execify AI Assistant
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md mb-2">
                        Ask me anything about your business data. I can create tasks,
                        generate invoices, update deals, and more.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 max-w-lg justify-center">
                        {[
                            "Show me open deals",
                            "Create a task for tomorrow",
                            "How much revenue this month?",
                            "Generate an invoice",
                        ].map((suggestion) => (
                            <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </div>
                </CardContent>

                {/* Input */}
                <div className="border-t border-border p-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask Execify AI anything..."
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
