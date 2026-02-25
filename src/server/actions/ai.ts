"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function getChatHistory() {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) return [];

    const conversations = await db.aIConversation.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
            messages: {
                where: { role: "USER" },
                orderBy: { createdAt: "asc" },
                take: 1
            }
        }
    });

    return conversations;
}

export async function getConversationMessages(id: string) {
    const user = await getCurrentUser();
    if (!user) return [];

    const messages = await db.aIMessage.findMany({
        where: { conversationId: id, conversation: { userId: user.id } },
        orderBy: { createdAt: "asc" }
    });

    return messages.map(m => ({
        id: m.id,
        role: m.role.toLowerCase() as "user" | "assistant" | "system" | "data",
        content: m.content
    }));
}
