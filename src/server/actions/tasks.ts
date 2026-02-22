"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withTenantScope } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    dueDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    assigneeId: z.string().optional(),
});

export async function getTasks(filters?: { status?: "TODO" | "DONE" }) {
    const { tasks } = await withTenantScope();

    // If status filter is provided, filter by it. otherwise show all or default logic.
    // We'll simplify: just return all for now, client can filter or provide params.
    const where = filters?.status
        ? { status: filters.status }
        : {};

    return tasks.findMany({
        where,
        include: { assignee: true },
        orderBy: { createdAt: "desc" },
    });
}

export async function createTask(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseResult = createTaskSchema.safeParse(rawData);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { organizationId } = await withTenantScope();
    const { requireActiveSubscription } = await import("@/lib/auth");
    await requireActiveSubscription();
    const user = await getCurrentUser();

    if (!user) return { error: "Unauthorized" };

    try {
        await db.task.create({
            data: {
                ...parseResult.data,
                organizationId,
                createdById: user.id,
            },
        });

        revalidatePath("/dashboard/tasks");
        return { success: true };
    } catch (error) {
        console.error("Failed to create task:", error);
        return { error: "Failed to create task" };
    }
}

export async function updateTaskStatus(taskId: string, status: "TODO" | "DONE") {
    const { organizationId } = await withTenantScope();
    const { requireActiveSubscription } = await import("@/lib/auth");
    await requireActiveSubscription();

    try {
        const existing = await db.task.findUnique({ where: { id: taskId } });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Task not found" };
        }

        await db.task.update({
            where: { id: taskId },
            data: {
                status,
                completedAt: status === "DONE" ? new Date() : null,
            },
        });

        revalidatePath("/dashboard/tasks");
        return { success: true };
    } catch (error) {
        console.error("Failed to update task status:", error);
        return { error: "Failed to update task status" };
    }
}

export async function deleteTask(id: string) {
    const { organizationId } = await withTenantScope();
    const { requireActiveSubscription } = await import("@/lib/auth");
    await requireActiveSubscription();

    try {
        const existing = await db.task.findUnique({ where: { id } });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Task not found" };
        }

        await db.task.delete({ where: { id } });
        revalidatePath("/dashboard/tasks");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete task:", error);
        return { error: "Failed to delete task" };
    }
}
