"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withTenantScope } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const createDealSchema = z.object({
    title: z.string().min(1, "Title is required"),
    value: z.coerce.number().min(0, "Value must be positive").optional(),
    stageId: z.string().min(1, "Stage is required"),
    contactId: z.string().optional(),
    probability: z.coerce.number().min(0).max(100).optional(),
    expectedCloseDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
});

export async function getDeals() {
    const { organizationId } = await withTenantScope();
    const { db } = await import("@/lib/db");

    // Fetch stages and deals in parallel
    const [stages, allDeals] = await Promise.all([
        db.dealStage.findMany({
            where: { organizationId },
            orderBy: { order: "asc" }
        }),
        db.deal.findMany({
            where: { organizationId },
            include: { contact: true },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const serializedDeals = allDeals.map((deal) => ({
        ...deal,
        value: deal.value ? deal.value.toNumber() : null,
    }));

    return { stages, deals: serializedDeals };
}

export async function createDeal(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseResult = createDealSchema.safeParse(rawData);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { organizationId } = await withTenantScope();
    const user = await getCurrentUser();

    if (!user) return { error: "Unauthorized" };

    try {
        await db.deal.create({
            data: {
                ...parseResult.data,
                organizationId,
                createdById: user.id,
            },
        });

        revalidatePath("/dashboard/deals");
        return { success: true };
    } catch (error) {
        console.error("Failed to create deal:", error);
        return { error: "Failed to create deal" };
    }
}

const updateDealSchema = z.object({
    title: z.string().min(1, "Title is required"),
    value: z.coerce.number().min(0, "Value must be positive").optional(),
    stageId: z.string().min(1, "Stage is required").optional(),
    contactId: z.string().optional().nullable(),
    probability: z.coerce.number().min(0).max(100).optional(),
    expectedCloseDate: z.string().optional().nullable().transform((str) => (str ? new Date(str) : null)),
});

export async function updateDeal(dealId: string, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries()) as any;

    // Handle nullable fields from FormData (which might be empty strings)
    if (rawData.contactId === "") rawData.contactId = null;
    if (rawData.expectedCloseDate === "") rawData.expectedCloseDate = null;

    const parseResult = updateDealSchema.safeParse(rawData);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { organizationId } = await withTenantScope();

    try {
        const existing = await db.deal.findUnique({
            where: { id: dealId },
        });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Deal not found" };
        }

        await db.deal.update({
            where: { id: dealId },
            data: parseResult.data,
        });

        revalidatePath("/dashboard/deals");
        return { success: true };
    } catch (error) {
        console.error("Failed to update deal:", error);
        return { error: "Failed to update deal" };
    }
}

export async function updateDealStage(dealId: string, stageId: string) {
    const { organizationId } = await withTenantScope();

    try {
        const existing = await db.deal.findUnique({
            where: { id: dealId },
        });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Deal not found" };
        }

        // Verify stage exists in org
        const stage = await db.dealStage.findUnique({
            where: { id: stageId },
        });

        if (!stage || stage.organizationId !== organizationId) {
            return { error: "Invalid stage" };
        }

        await db.deal.update({
            where: { id: dealId },
            data: { stageId },
        });

        revalidatePath("/dashboard/deals");
        return { success: true };
    } catch (error) {
        console.error("Failed to update deal stage:", error);
        return { error: "Failed to update deal stage" };
    }
}

export async function deleteDeal(id: string) {
    const { organizationId } = await withTenantScope();

    try {
        const existing = await db.deal.findUnique({ where: { id } });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Deal not found" };
        }

        await db.deal.delete({ where: { id } });
        revalidatePath("/dashboard/deals");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete deal:", error);
        return { error: "Failed to delete deal" };
    }
}
