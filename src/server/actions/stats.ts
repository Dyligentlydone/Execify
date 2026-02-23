"use server";

import { withTenantScope } from "@/lib/tenant";

export async function getDashboardStats() {
    const { contacts, deals, tasks, invoices } = await withTenantScope();

    const totalContacts = await contacts.count({ where: { status: "ACTIVE" } });
    const openDealsCount = await deals.count({ where: { stage: { name: { not: "Closed Won" } } } });
    const openDealsValue = await deals.aggregate({
        _sum: { value: true },
        where: { stage: { name: { notIn: ["Closed Won", "Closed Lost"] } } }
    });
    const pendingTasks = await tasks.count({ where: { status: "TODO" } });
    const revenue = await invoices.aggregate({
        _sum: { total: true },
        where: { status: "PAID" }
    });

    return {
        totalContacts,
        openDealsCount,
        openDealsValue: Number(openDealsValue._sum?.value || 0),
        pendingTasks,
        totalRevenue: Number(revenue._sum?.total || 0)
    };
}
