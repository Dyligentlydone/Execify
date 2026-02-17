"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withTenantScope } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const createNoteSchema = z.object({
    content: z.string().min(1, "Note content is required"),
    entityType: z.enum(["CONTACT", "DEAL", "TASK"]),
    entityId: z.string().min(1, "Entity ID is required"),
});

export async function createNote(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseResult = createNoteSchema.safeParse(rawData);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { organizationId } = await withTenantScope();
    const user = await getCurrentUser();

    if (!user) return { error: "Unauthorized" };

    try {
        const { content, entityType, entityId } = parseResult.data;

        await db.note.create({
            data: {
                content,
                organizationId,
                createdById: user.id,
                contactId: entityType === "CONTACT" ? entityId : undefined,
                dealId: entityType === "DEAL" ? entityId : undefined,
                taskId: entityType === "TASK" ? entityId : undefined,
            },
        });

        // Revalidate paths - simplest is to revalidate the whole dashboard or specific pages
        revalidatePath("/dashboard/contacts");
        revalidatePath("/dashboard/deals");
        revalidatePath("/dashboard/tasks");
        return { success: true };
    } catch (error) {
        console.error("Failed to create note:", error);
        return { error: "Failed to create note" };
    }
}

export async function getNotes(entityType: "CONTACT" | "DEAL" | "TASK", entityId: string) {
    const { notes } = await withTenantScope();

    const where: any = {};
    if (entityType === "CONTACT") where.contactId = entityId;
    if (entityType === "DEAL") where.dealId = entityId;
    if (entityType === "TASK") where.taskId = entityId;

    return notes.findMany({
        where,
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
    });
}
