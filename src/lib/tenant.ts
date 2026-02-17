import { db } from "@/lib/db";
import { getTenantId } from "@/lib/auth";

/**
 * Tenant-scoped database helpers. All queries are automatically
 * filtered by the current organization.
 */

export async function withTenantScope() {
    const organizationId = await getTenantId();

    return {
        organizationId,

        /** Contacts scoped to current tenant */
        contacts: {
            findMany: (args?: Parameters<typeof db.contact.findMany>[0]) =>
                db.contact.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
            findUnique: (args: Parameters<typeof db.contact.findUnique>[0]) =>
                db.contact.findUnique(args).then((c) =>
                    c?.organizationId === organizationId ? c : null
                ),
            count: (args?: Parameters<typeof db.contact.count>[0]) =>
                db.contact.count({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
        },

        /** Deals scoped to current tenant */
        deals: {
            findMany: (args?: Parameters<typeof db.deal.findMany>[0]) =>
                db.deal.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
            count: (args?: Parameters<typeof db.deal.count>[0]) =>
                db.deal.count({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
            aggregate: (args: Parameters<typeof db.deal.aggregate>[0]) =>
                db.deal.aggregate({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
        },

        /** Tasks scoped to current tenant */
        tasks: {
            findMany: (args?: Parameters<typeof db.task.findMany>[0]) =>
                db.task.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
            count: (args?: Parameters<typeof db.task.count>[0]) =>
                db.task.count({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
        },

        /** Invoices scoped to current tenant */
        invoices: {
            findMany: (args?: Parameters<typeof db.invoice.findMany>[0]) =>
                db.invoice.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
            count: (args?: Parameters<typeof db.invoice.count>[0]) =>
                db.invoice.count({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
            aggregate: (args: Parameters<typeof db.invoice.aggregate>[0]) =>
                db.invoice.aggregate({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
        },

        /** Activity logs scoped to current tenant */
        activityLogs: {
            findMany: (args?: Parameters<typeof db.activityLog.findMany>[0]) =>
                db.activityLog.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
        },

        /** Dashboard layouts scoped to current tenant */
        dashboardLayouts: {
            findMany: (args?: Parameters<typeof db.dashboardLayout.findMany>[0]) =>
                db.dashboardLayout.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
        },

        /** Notes scoped to current tenant */
        notes: {
            findMany: (args?: Parameters<typeof db.note.findMany>[0]) =>
                db.note.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                }),
        },

        /** Deal stages scoped to current tenant */
        dealStages: {
            findMany: (args?: Parameters<typeof db.dealStage.findMany>[0]) =>
                db.dealStage.findMany({
                    ...args,
                    where: { ...args?.where, organizationId },
                    orderBy: args?.orderBy ?? { order: "asc" },
                }),
        },
    };
}
