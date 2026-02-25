"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, Bot, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";

export function AIChatClient({ initialConversationId }: { initialConversationId?: string }) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat", body: { conversationId: initialConversationId } }),
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Force scroll strictly when sending a new message
    useEffect(() => {
        if (status === 'submitted') {
            setTimeout(() => {
                scrollToBottom();
            }, 50); // Small delay to let DOM paint the new user message
        }
    }, [status]);

    const isLoading = status !== "ready" && status !== "error" && status !== undefined;

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage({ role: "user", content: input } as any);
        setInput("");
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Card className="flex-1 min-h-0 border-border/50 flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm relative">
            <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto text-center pt-20">
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
                                Try asking about "Q3 Revenue", "Top Performing Clients", or tell me to log a new expense.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pb-4">
                        {messages.map((m: any) => (
                            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                {m.role !== "user" && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                )}

                                <div className={`max-w-[80%] space-y-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                                    {m.parts && m.parts.length > 0 ? (
                                        m.parts.map((part: any, i: number) => {
                                            if (part.type === 'text') {
                                                return (
                                                    <div key={i} className={`px-4 py-2 rounded-2xl ${m.role === "user" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm rounded-br-none" : "bg-muted/50 text-white border border-border/50 rounded-bl-none"}`}>
                                                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{part.text}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })
                                    ) : (
                                        m.content && (
                                            <div className={`px-4 py-2 rounded-2xl ${m.role === "user" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm rounded-br-none" : "bg-muted/50 text-white border border-border/50 rounded-bl-none"}`}>
                                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.content}</p>
                                            </div>
                                        )
                                    )}
                                    {/* Tool Calls Rendering */}
                                    {m.toolInvocations?.map((toolInvocation: any) => {
                                        const { toolName, toolCallId, state } = toolInvocation;
                                        const isDone = state === 'output-available' || state === 'result';
                                        return isDone ? (
                                            <div key={toolCallId} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full w-fit border border-border/50 mt-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                <span>Successfully ran: <strong>{toolName}</strong></span>
                                            </div>
                                        ) : (
                                            <div key={toolCallId} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full w-fit border border-border/50 mt-1 animate-pulse">
                                                <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                <span>Running <strong>{toolName}</strong>...</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {m.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="h-1 flex-shrink-0" style={{ overflowAnchor: "auto" }} />
                    </div>
                )}
            </ScrollArea>

            {/* Input Form */}
            <div className="p-4 bg-background border-t border-border/50 z-10 shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        placeholder={isLoading ? "AI is running tasks..." : "Ask Execufy AI anything..."}
                        className="flex-1 bg-card border-border/50 shadow-sm h-12 rounded-full pl-6 pr-14"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        size="icon"
                        className="absolute right-1.5 top-1.5 h-9 w-9 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-full transition-all duration-300 shadow-md"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
