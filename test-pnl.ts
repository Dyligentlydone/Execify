import { PrismaClient } from './src/generated/prisma/client';
import { expandRecurringExpenses } from './src/lib/expense-utils';
import { startOfDay, endOfDay } from 'date-fns';

const db = new PrismaClient();

async function getPnLData(organizationId: string, startDate: string, endDate: string) {
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    const paidInvoices = await db.invoice.findMany({
        where: {
            organizationId,
            status: "PAID",
            paidAt: { gte: start, lte: end },
        },
        include: { contact: true },
        orderBy: { paidAt: "desc" },
    });

    const rawRecurring = await db.recurringInvoice.findMany({
        where: { organizationId, status: "ACTIVE" },
        include: { contact: true }
    });

    const projectedRecurring = expandRecurringExpenses(
        rawRecurring.map(ri => ({
            id: ri.id,
            date: ri.nextRunDate,
            type: "RECURRING",
            isActive: true,
            frequency: ri.frequency as any,
            interval: ri.interval,
            amount: ri.total
        })),
        start,
        end
    );

    const filteredProjections = projectedRecurring.filter(proj => {
        const projMonth = `${proj.date.getFullYear()}-${proj.date.getMonth()}`;
        const recurringPlan = rawRecurring.find(r => r.id === proj.id.split('-')[0]);
        if (!recurringPlan) return true;

        const alreadyPaid = paidInvoices.some(inv => {
            if (inv.contactId !== recurringPlan.contactId) return false;
            if (Math.abs(Number(inv.total) - Number(proj.amount)) > 0.01) return false;
            const invMonth = `${inv.paidAt!.getFullYear()}-${inv.paidAt!.getMonth()}`;
            return invMonth === projMonth;
        });

        return !alreadyPaid;
    });

    const actualRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const projectedRevenue = filteredProjections.reduce((sum, ri) => sum + Number(ri.amount), 0);
    const revenue = actualRevenue + projectedRevenue;

    return {
        start: start.toISOString(),
        end: end.toISOString(),
        revenue,
        actualRevenue,
        projectedRevenue,
        paidInvoices: paidInvoices.map(i => ({ id: i.id, paidAt: i.paidAt?.toISOString(), amount: i.total })),
        projectedInvoices: filteredProjections.map(i => ({ id: i.id, date: i.date.toISOString(), amount: i.amount }))
    };
}

async function main() {
    const orgId = 'cmlsw04m3003blf01pshipwek'; // User's org
    const thisMonth = await getPnLData(orgId, '2026-02-01', '2026-02-28');
    const ytd = await getPnLData(orgId, '2026-01-01', '2026-02-28');

    console.log("THIS MONTH:", JSON.stringify(thisMonth, null, 2));
    console.log("YEAR TO DATE:", JSON.stringify(ytd, null, 2));

    await db.$disconnect();
}
main().catch(console.error);
