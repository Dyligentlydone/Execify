"use client";

import { useState, useEffect } from "react";
import { AIChatClient } from "./ai-chat-client";
import { getConversationMessages } from "@/server/actions/ai";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AIChatLayout({ history }: { history: any[] }) {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [initialMessages, setInitialMessages] = useState<any[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatKey, setChatKey] = useState(0); // For forcing re-render of AIChatClient

    useEffect(() => {
        if (!selectedChatId) {
            setInitialMessages([]);
            setChatKey(prev => prev + 1);
            return;
        }

        async function loadMessages() {
            setIsLoadingChat(true);
            try {
                const msgs = await getConversationMessages(selectedChatId!);
                setInitialMessages(msgs);
                setChatKey(prev => prev + 1);
            } catch (err) {
                console.error("Failed to load conversation", err);
            } finally {
                setIsLoadingChat(false);
            }
        }

        loadMessages();
    }, [selectedChatId]);

    return (
        <div className="flex h-full min-h-0 relative gap-4 rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-border/50 bg-muted/20 flex flex-col hidden md:flex shrink-0">
                <div className="p-4 border-b border-border/50">
                    <Button
                        onClick={() => setSelectedChatId(null)}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white border-0 shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Chat
                    </Button>
                </div>
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-1">
                        {history.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center pt-8 p-4">
                                No previous conversations.
                            </div>
                        ) : (
                            history.map(conv => {
                                const preview = conv.messages[0]?.content || "New Conversation";
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedChatId(conv.id)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg text-sm transition-colors hover:bg-muted group relative flex flex-col gap-1",
                                            selectedChatId === conv.id ? "bg-muted shadow-sm ring-1 ring-border/50" : ""
                                        )}
                                    >
                                        <div className="flex items-center gap-2 text-foreground font-medium truncate">
                                            <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                                            <span className="truncate">{preview}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/50 relative">
                {isLoadingChat ? (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                ) : null}

                {/* We pass a key to force complete remount when switching chats to clear the useChat internal state cleanly */}
                <AIChatClient
                    key={chatKey}
                    initialConversationId={selectedChatId || undefined}
                    initialMessages={initialMessages}
                />
            </div>
        </div>
    );
}
