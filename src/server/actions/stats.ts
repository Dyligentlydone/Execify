"use server";

import { withTenantScope } from "@/lib/tenant";

export async function getDashboardStats() {
    const { contacts, deals, tasks, invoices } = await withTenantScope();

    const [
        totalContacts,
        openDealsCount,
        openDealsValue,
        pendingTasks,
        revenue
    ] = await Promise.all([
        contacts.count({ where: { status: "ACTIVE" } }),
        deals.count({ where: { stage: { name: { not: "Closed Won" } } } }),
        deals.aggregate({
            _sum: { value: true },
            where: { stage: { name: { notIn: ["Closed Won", "Closed Lost"] } } }
        }),
        tasks.count({ where: { status: "TODO" } }),
        invoices.aggregate({
            _sum: { total: true },
            where: { status: "PAID" }
        })
    ]);

    return {
        totalContacts,
        openDealsCount,
        openDealsValue: Number(openDealsValue._sum?.value || 0),
        pendingTasks,
        totalRevenue: Number(revenue._sum?.total || 0)
    };
}
