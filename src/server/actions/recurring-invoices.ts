"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withTenantScope } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RecurringStatus, RecurringFrequency, Role } from "@/generated/prisma/client";

const recurringItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().min(0, "Price must be positive"),
});

const createRecurringSchema = z.object({
    name: z.string().min(1, "Template name is required"),
    contactId: z.string().min(1, "Customer is required"),
    frequency: z.nativeEnum(RecurringFrequency),
    interval: z.coerce.number().min(1).default(1),
    startDate: z.string().min(1).transform((str) => new Date(str)),
    items: z.array(recurringItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional(),
});

export async function getRecurringInvoices() {
    const { organizationId } = await withTenantScope();

    const recurring = await db.recurringInvoice.findMany({
        where: { organizationId },
        include: {
            contact: true,
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return recurring;
}

export async function createRecurringInvoice(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    let items: any[] = [];
    try {
        items = JSON.parse(rawData.items as string);
    } catch (e) {
        return { error: "Invalid items format" };
    }

    const dataToValidate = {
        ...rawData,
        items,
    };

    const parseResult = createRecurringSchema.safeParse(dataToValidate);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { name, contactId, frequency, interval, startDate, items: validItems, notes } = parseResult.data;
    const { organizationId } = await withTenantScope();
    const user = await getCurrentUser();

    if (!user) return { error: "Unauthorized" };

    try {
        // Calculate totals
        const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = 0;
        const total = subtotal + tax;

        await db.recurringInvoice.create({
            data: {
                organizationId,
                name,
                contactId,
                frequency,
                interval,
                startDate,
                nextRunDate: startDate, // First run is on start date
                status: "ACTIVE",
                subtotal,
                tax,
                total,
                currency: "USD",
                notes,
                createdById: user.id,
                items: {
                    create: validItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice
                    }))
                }
            },
        });

        revalidatePath("/dashboard/invoices");
        return { success: true };
    } catch (error) {
        console.error("Failed to create recurring invoice:", error);
        return { error: "Failed to create recurring invoice template" };
    }
}

export async function pauseRecurringInvoice(id: string, pause: boolean) {
    const { organizationId } = await withTenantScope();

    try {
        const existing = await db.recurringInvoice.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Template not found" };
        }

        await db.recurringInvoice.update({
            where: { id },
            data: {
                status: pause ? "PAUSED" : "ACTIVE"
            }
        });

        revalidatePath("/dashboard/invoices");
        return { success: true };
    } catch (error) {
        console.error("Failed to update template status:", error);
        return { error: "Failed to update template status" };
    }
}

/**
 * Process all due recurring invoices. 
 * In production, this would be called by a cron job (e.g., Vercel Cron or GitHub Action).
 */
export async function processRecurringBilling() {
    const now = new Date();

    // Find all active templates that are due
    const dueTemplates = await db.recurringInvoice.findMany({
        where: {
            status: "ACTIVE",
            nextRunDate: {
                lte: now
            }
        },
        include: {
            items: true
        }
    });

    console.log(`Processing ${dueTemplates.length} due recurring invoices...`);

    for (const template of dueTemplates) {
        try {
            await db.$transaction(async (tx) => {
                // 1. Generate the actual invoice
                const count = await tx.invoice.count({ where: { organizationId: template.organizationId } });
                const invoiceNumber = `INV-${(count + 1).toString().padStart(4, "0")}`;

                await tx.invoice.create({
                    data: {
                        organizationId: template.organizationId,
                        invoiceNumber,
                        contactId: template.contactId,
                        dueDate: new Date(), // Due immediately for recurring
                        status: "SENT", // Usually auto-sent
                        subtotal: template.subtotal,
                        tax: template.tax,
                        total: template.total,
                        currency: template.currency,
                        createdById: template.createdById,
                        recurringInvoiceId: template.id,
                        notes: template.notes,
                        items: {
                            create: template.items.map(item => ({
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                total: item.total
                            }))
                        }
                    }
                });

                // 2. Update nextRunDate
                const nextDate = calculateNextRunDate(template.nextRunDate, template.frequency, template.interval);

                await tx.recurringInvoice.update({
                    where: { id: template.id },
                    data: {
                        nextRunDate: nextDate,
                        // If there was an end date and we've passed it, mark as completed
                        status: template.endDate && nextDate > template.endDate ? "COMPLETED" : "ACTIVE"
                    }
                });
            });
        } catch (error) {
            console.error(`Failed to process recurring invoice ${template.id}:`, error);
        }
    }

    // We don't revalidatePath here because it might be called during render.
    // The caller should handle revalidation if needed.
    return { processed: dueTemplates.length };
}

function calculateNextRunDate(current: Date, frequency: RecurringFrequency, interval: number): Date {
    const next = new Date(current);
    switch (frequency) {
        case "DAILY":
            next.setDate(next.getDate() + interval);
            break;
        case "WEEKLY":
            next.setDate(next.getDate() + interval * 7);
            break;
        case "MONTHLY":
            next.setMonth(next.getMonth() + interval);
            break;
        case "YEARLY":
            next.setFullYear(next.getFullYear() + interval);
            break;
    }
    return next;
}
