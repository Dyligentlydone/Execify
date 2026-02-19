"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withTenantScope } from "@/lib/tenant";
import { PLANS } from "@/lib/stripe";

const createContactSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "LEAD", "CUSTOMER"]).default("ACTIVE"),
});

const updateContactSchema = createContactSchema.partial();

export async function getContacts(
    params: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    } = {}
) {
    const { organizationId } = await withTenantScope();
    const { db } = await import("@/lib/db");

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
        organizationId,
    };

    if (params.search) {
        where.OR = [
            { firstName: { contains: params.search, mode: "insensitive" } },
            { lastName: { contains: params.search, mode: "insensitive" } },
            { company: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
        ];
    }

    const [data, total] = await Promise.all([
        db.contact.findMany({
            where,
            skip,
            take: limit,
            orderBy: params.sortBy
                ? { [params.sortBy]: params.sortOrder || "asc" }
                : { createdAt: "desc" },
        }),
        db.contact.count({ where }),
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function createContact(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseResult = createContactSchema.safeParse(rawData);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { contacts, organizationId } = await withTenantScope();
    // We need current user ID for `createdById`. `withTenantScope` provides orgId.
    // We'll import `getCurrentUser` here.
    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();

    if (!user) return { error: "Unauthorized" };

    try {
        await contacts.findMany; // Just to make TS happy if needed (no, create is not scoped by helper but need orgId)
        // Actually `withTenantScope` returns scoped repository methods for find/count.
        // For CREATE, we need to manually create with `organizationId`.
        // The helper logic was:
        /*
        contacts: {
          findMany: ...,
          findUnique: ...,
          count: ...
        }
        */
        // It doesn't have `create`. We should use `db.contact.create` directly but inject `organizationId`.

        const { db } = await import("@/lib/db");

        // Check Plan Limits
        const org = await db.organization.findUnique({
            where: { id: organizationId },
            select: { plan: true },
        });

        const currentPlan = org?.plan ? PLANS[org.plan as keyof typeof PLANS] : PLANS.STARTER;
        const contactCount = await db.contact.count({
            where: { organizationId },
        });

        if (contactCount >= currentPlan.limits.contacts) {
            return { error: "Contact limit reached. Please upgrade your plan." };
        }

        const contact = await db.contact.create({
            data: {
                ...parseResult.data,
                organizationId,
                createdById: user.id,
            },
        });

        revalidatePath("/dashboard/contacts");
        // Serialize through JSON to ensure plain objects (strip Prisma Date/Decimal types)
        return { success: true, data: JSON.parse(JSON.stringify(contact)) };
    } catch (error) {
        console.error("Failed to create contact:", error);
        return { error: "Failed to create contact" };
    }
}

export async function updateContact(id: string, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const parseResult = updateContactSchema.safeParse(rawData);

    if (!parseResult.success) {
        return { error: parseResult.error.flatten().fieldErrors };
    }

    const { organizationId } = await withTenantScope();
    const { db } = await import("@/lib/db");

    try {
        // Verify ownership/tenant
        const existing = await db.contact.findUnique({
            where: { id },
        });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Contact not found" };
        }

        await db.contact.update({
            where: { id },
            data: parseResult.data,
        });

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (error) {
        console.error("Failed to update contact:", error);
        return { error: "Failed to update contact" };
    }
}

export async function deleteContact(id: string) {
    const { organizationId } = await withTenantScope();
    const { db } = await import("@/lib/db");

    try {
        // Verify ownership/tenant
        const existing = await db.contact.findUnique({
            where: { id },
        });

        if (!existing || existing.organizationId !== organizationId) {
            return { error: "Contact not found" };
        }

        await db.contact.delete({
            where: { id },
        });

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete contact:", error);
        return { error: "Failed to delete contact" };
    }
}
