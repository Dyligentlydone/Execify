import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AIPage() {
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
