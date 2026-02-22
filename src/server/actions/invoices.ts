"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withTenantScope } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { InvoiceStatus } from "@/generated/prisma/client";

const invoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().min(0, "Price must be positive"),
});

const createInvoiceSchema = z.object({
    contactId: z.string().min(1, "Customer is required"),
    dueDate: z.string().min(1).transform((str) => new Date(str)),
    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export async function getInvoices() {
    const { organizationId } = await withTenantScope();

    const invoices = await db.invoice.findMany({
        where: { organizationId },
        include: {
            contact: true,
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return invoices;
}

export async function createInvoice(formData: FormData) {
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

    const parseResult = createInvoiceSchema.safeParse(dataToValidate);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { contactId, dueDate, items: validItems } = parseResult.data;
    const { organizationId, invoices } = await withTenantScope();
    const { requireActiveSubscription } = await import("@/lib/auth");
    await requireActiveSubscription();
    const user = await getCurrentUser();

    if (!user) return { error: "Unauthorized" };

    try {
        const count = await invoices.count();
        const invoiceNumber = `INV-${(count + 1).toString().padStart(4, "0")}`;

        // Calculate totals
        const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = 0; // Placeholder for now
        const total = subtotal + tax;

        await db.invoice.create({
            data: {
                organizationId,
                invoiceNumber,
                contactId,
                dueDate,
                status: "DRAFT", // Default status
                subtotal,
                tax,
                total,
                currency: "USD",
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
        console.error("Failed to create invoice:", error);
        return { error: "Failed to create invoice" };
    }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
    const { organizationId } = await withTenantScope();
    const { requireActiveSubscription } = await import("@/lib/auth");
    await requireActiveSubscription();

    try {
        const existing = await db.invoice.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Invoice not found" };
        }

        const data: any = { status };
        if (status === "PAID") {
            data.paidAt = new Date();
        }

        await db.invoice.update({
            where: { id },
            data
        });

        revalidatePath("/dashboard/invoices");
        return { success: true };
    } catch (error) {
        console.error("Failed to update invoice status:", error);
        return { error: "Failed to update invoice status" };
    }
}

const updateInvoiceSchema = z.object({
    dueDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    items: z.array(z.object({
        id: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.coerce.number().min(1),
        unitPrice: z.coerce.number().min(0),
    })).min(1, "At least one item is required"),
});

export async function updateInvoice(id: string, formData: FormData) {
    const { organizationId } = await withTenantScope();
    const { requireActiveSubscription } = await import("@/lib/auth");
    await requireActiveSubscription();

    const existing = await db.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!existing || existing.organizationId !== organizationId) {
        return { error: "Invoice not found" };
    }

    let items: any[];
    try {
        items = JSON.parse(formData.get("items") as string);
    } catch {
        return { error: "Invalid items format" };
    }

    const parseResult = updateInvoiceSchema.safeParse({
        dueDate: formData.get("dueDate") as string || undefined,
        items,
    });

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { dueDate, items: validItems } = parseResult.data;

    try {
        const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const total = subtotal + Number(existing.tax);

        // Delete existing items and recreate
        await db.invoiceItem.deleteMany({ where: { invoiceId: id } });

        await db.invoice.update({
            where: { id },
            data: {
                ...(dueDate && { dueDate }),
                subtotal,
                total,
                items: {
                    create: validItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            },
        });

        revalidatePath("/dashboard/invoices");
        revalidatePath("/dashboard/financials");
        return { success: true };
    } catch (error) {
        console.error("Failed to update invoice:", error);
        return { error: "Failed to update invoice" };
    }
}

export async function deleteInvoice(id: string) {
    const { organizationId } = await withTenantScope();
    const { requireActiveSubscription } = await import("@/lib/auth");
    await requireActiveSubscription();

    try {
        const existing = await db.invoice.findUnique({ where: { id } });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Invoice not found" };
        }

        await db.invoice.delete({ where: { id } });
        revalidatePath("/dashboard/invoices");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete invoice:", error);
        return { error: "Failed to delete invoice" };
    }
}
