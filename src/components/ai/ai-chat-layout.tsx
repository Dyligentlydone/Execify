"use client";

import { useState, useEffect } from "react";
import { AIChatClient } from "./ai-chat-client";
import { getConversationMessages } from "@/server/actions/ai";
import { formatDistanceToNow } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function AIChatLayout({ history }: { history: any[] }) {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [initialMessages, setInitialMessages] = useState<any[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatKey, setChatKey] = useState(0);

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
        <div className="flex flex-col h-full min-h-0 relative gap-0 rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Top Toolbar for History */}
            <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20 shrink-0 gap-4">
                <div className="w-[350px] max-w-full">
                    <Select
                        value={selectedChatId || "new"}
                        onValueChange={(v) => setSelectedChatId(v === "new" ? null : v)}
                    >
                        <SelectTrigger className="w-full bg-background border-border/50 shadow-sm">
                            <SelectValue placeholder="Recent Conversations" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="new" className="font-semibold text-amber-500">
                                Conversations
                            </SelectItem>
                            {history.length > 0 && <div className="h-px bg-border my-1" />}
                            {history.map(conv => {
                                const previewText = conv.messages[0]?.content || "New Conversation";
                                const truncated = previewText.length > 35 ? previewText.substring(0, 35) + "..." : previewText;
                                const timeAgo = formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true });

                                return (
                                    <SelectItem key={conv.id} value={conv.id} className="py-2 cursor-pointer">
                                        <div className="flex flex-col">
                                            <span className="truncate">{truncated}</span>
                                            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={() => setSelectedChatId(null)}
                    size="sm"
                    className="bg-muted hover:bg-muted/80 text-foreground border border-border/50 shadow-sm shrink-0 whitespace-nowrap"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                </Button>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/50 relative overflow-hidden">
                {isLoadingChat ? (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                ) : null}

                <AIChatClient
                    key={chatKey}
                    initialConversationId={selectedChatId || undefined}
                    initialMessages={initialMessages}
                />
            </div>
        </div>
    );
}
