"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withTenantScope } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseType, RecurringFrequency } from "@/generated/prisma/client";


const createExpenseSchema = z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().min(0.01, "Amount must be positive"),
    date: z.string().min(1).transform((str) => new Date(str)),
    type: z.nativeEnum(ExpenseType),
    category: z.string().min(1, "Category is required"),
    vendor: z.string().optional(),
    notes: z.string().optional(),
    receiptUrl: z.string().optional(),
    contactId: z.string().optional(),
    frequency: z.nativeEnum(RecurringFrequency).optional(),
    interval: z.coerce.number().min(1).optional(),
});

export async function getExpenses(startDate?: string, endDate?: string) {
    const { organizationId } = await withTenantScope();

    const where: any = { organizationId };
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) {
            const endDt = new Date(endDate);
            endDt.setUTCDate(endDt.getUTCDate() + 1);
            endDt.setUTCHours(23, 59, 59, 999);
            where.date.lte = endDt;
        }
    }

    const expenses = await db.expense.findMany({
        where,
        include: { contact: true },
        orderBy: { date: "desc" },
    });

    return JSON.parse(JSON.stringify(expenses));
}

export async function createExpense(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    const parseResult = createExpenseSchema.safeParse(rawData);
    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { organizationId } = await withTenantScope();
    const user = await getCurrentUser();
    if (!user) return { error: "Unauthorized" };

    const { description, amount, date, type, category, vendor, notes, receiptUrl, contactId, frequency, interval } = parseResult.data;

    try {
        const expense = await db.expense.create({
            data: {
                description,
                amount,
                date,
                type,
                category,
                vendor: vendor || null,
                notes: notes || null,
                receiptUrl: receiptUrl || null,
                contactId: contactId || null,
                frequency: type === "RECURRING" ? (frequency || "MONTHLY") : null,
                interval: type === "RECURRING" ? (interval || 1) : null,
                isActive: true,
                organizationId,
                createdById: user.id,
            },
        });

        revalidatePath("/dashboard/financials");
        return { success: true, data: JSON.parse(JSON.stringify(expense)) };
    } catch (error) {
        console.error("Failed to create expense:", error);
        return { error: "Failed to create expense" };
    }
}

export async function deleteExpense(id: string) {
    const { organizationId } = await withTenantScope();

    try {
        const existing = await db.expense.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Expense not found" };
        }

        await db.expense.delete({ where: { id } });

        revalidatePath("/dashboard/financials");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete expense:", error);
        return { error: "Failed to delete expense" };
    }
}

export async function updateExpense(id: string, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseResult = createExpenseSchema.safeParse(rawData);
    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { organizationId } = await withTenantScope();

    try {
        const existing = await db.expense.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Expense not found" };
        }

        const { description, amount, date, type, category, vendor, notes, receiptUrl, contactId, frequency, interval } = parseResult.data;

        await db.expense.update({
            where: { id },
            data: {
                description,
                amount,
                date,
                type,
                category,
                vendor: vendor || null,
                notes: notes || null,
                receiptUrl: receiptUrl || null,
                contactId: contactId || null,
                frequency: type === "RECURRING" ? (frequency || "MONTHLY") : null,
                interval: type === "RECURRING" ? (interval || 1) : null,
            },
        });

        revalidatePath("/dashboard/financials");
        return { success: true };
    } catch (error) {
        console.error("Failed to update expense:", error);
        return { error: "Failed to update expense" };
    }
}
