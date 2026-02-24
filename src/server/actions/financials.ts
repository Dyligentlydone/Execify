"use server";

import { withTenantScope } from "@/lib/tenant";
import { db } from "@/lib/db";
import { expandRecurringExpenses } from "@/lib/expense-utils";

export type PnLData = {
    revenue: number;
    expenses: number;
    netProfitLoss: number;
    expensesByCategory: { category: string; total: number }[];
    monthlyBreakdown: {
        month: string;
        revenue: number;
        expenses: number;
    }[];
    recentIncome: any[];
};

export async function getPnLData(startDate: string, endDate: string): Promise<PnLData> {
    const { organizationId } = await withTenantScope();

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Add 1 full day buffer + end-of-day in UTC to handle timezone drift
    // Client sends "2026-02-16" (local date), but DB may store timestamps
    // a day ahead in UTC (e.g., 11pm EST = 4am UTC next day)
    end.setUTCDate(end.getUTCDate() + 1);
    end.setUTCHours(23, 59, 59, 999);


    // 1. Revenue: sum of PAID invoices in the period
    // Use paidAt if available, otherwise fall back to createdAt for older invoices
    const paidInvoices = await db.invoice.findMany({
        where: {
            organizationId,
            status: "PAID",
            OR: [
                { paidAt: { gte: start, lte: end } },
                { paidAt: null, createdAt: { gte: start, lte: end } },
            ],
        },
        include: { contact: true },
        orderBy: { paidAt: "desc" },
    });

    const revenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    // 2. Expenses: sum in the period
    const rawExpenses = await db.expense.findMany({
        where: {
            organizationId,
            OR: [
                { type: "ONE_TIME", date: { gte: start, lte: end } },
                { type: "RECURRING", isActive: true, date: { lte: end } }
            ]
        },
        orderBy: { date: "asc" },
    });

    const expenses = expandRecurringExpenses(rawExpenses, start, end);

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // 3. Expenses by category
    const categoryMap = new Map<string, number>();
    for (const exp of expenses) {
        const current = categoryMap.get(exp.category) || 0;
        categoryMap.set(exp.category, current + Number(exp.amount));
    }
    const expensesByCategory = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

    // 4. Monthly breakdown for charts
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();

    // Initialize months in range
    // For "Year to Date" or any range starting in January, let's always show all 12 months 
    // to give a "full year" perspective of the chart.
    const startCursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCursor = (start.getMonth() === 0) ? new Date(start.getFullYear(), 11, 31) : end;

    const cursor = new Date(startCursor);
    while (cursor <= endCursor) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap.set(key, { revenue: 0, expenses: 0 });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const inv of paidInvoices) {
        // Use issueDate if available for the chart to reflect performance, 
        // fallback to createdAt/paidAt
        const d = new Date(inv.issueDate || inv.paidAt || inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = monthlyMap.get(key);
        if (entry) {
            entry.revenue += Number(inv.total);
        } else {
            // If it's outside the current range (e.g. an old invoice paid recently)
            // but we still want it in the chart, we might need a broader map.
            // For now, if "Year to Date" is selected, we focus on the year's months.
        }
    }

    for (const exp of expenses) {
        // Map to the month of the occurrence
        const d = new Date(exp.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const entry = monthlyMap.get(key);
        if (entry) {
            entry.expenses += Number(exp.amount);
        }
    }

    const monthlyBreakdown = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
            month,
            revenue: Math.round(data.revenue * 100) / 100,
            expenses: Math.round(data.expenses * 100) / 100,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    // 5. Recent income (last 20 paid invoices)
    const recentIncome = paidInvoices.slice(0, 20).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        contactName: inv.contact
            ? `${inv.contact.firstName} ${inv.contact.lastName}`
            : "Unknown",
        amount: Number(inv.total),
        paidAt: (inv.paidAt || inv.createdAt)?.toISOString() || null,
    }));

    return {
        revenue: Math.round(revenue * 100) / 100,
        expenses: Math.round(totalExpenses * 100) / 100,
        netProfitLoss: Math.round((revenue - totalExpenses) * 100) / 100,
        expensesByCategory,
        monthlyBreakdown,
        recentIncome,
    };
}

export type ClientMargin = {
    contactId: string;
    contactName: string;
    company: string | null;
    income: number;
    expenses: number;
    profit: number;
    margin: number; // percentage
};

export async function getClientMargins(startDate: string, endDate: string): Promise<ClientMargin[]> {
    const { organizationId } = await withTenantScope();

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setUTCDate(end.getUTCDate() + 1);
    end.setUTCHours(23, 59, 59, 999);

    // Get all paid invoices in the period grouped by contact
    const paidInvoices = await db.invoice.findMany({
        where: {
            organizationId,
            status: "PAID",
            contactId: { not: null },
            OR: [
                { paidAt: { gte: start, lte: end } },
                { paidAt: null, createdAt: { gte: start, lte: end } },
            ],
        },
        include: { contact: true },
    });

    // Get all expenses linked to contacts in the period
    const rawContactExpenses = await db.expense.findMany({
        where: {
            organizationId,
            contactId: { not: null },
            OR: [
                { type: "ONE_TIME", date: { gte: start, lte: end } },
                { type: "RECURRING", isActive: true, date: { lte: end } }
            ]
        },
        include: { contact: true },
    });

    // Expand the recurring ones to determine actual amounts incurred in the period
    const contactExpenses = expandRecurringExpenses(rawContactExpenses, start, end);

    // Aggregate by contact
    const marginMap = new Map<string, {
        contactName: string;
        company: string | null;
        income: number;
        expenses: number;
    }>();

    for (const inv of paidInvoices) {
        if (!inv.contactId || !inv.contact) continue;
        const existing = marginMap.get(inv.contactId) || {
            contactName: `${inv.contact.firstName} ${inv.contact.lastName}`,
            company: inv.contact.company,
            income: 0,
            expenses: 0,
        };
        existing.income += Number(inv.total);
        marginMap.set(inv.contactId, existing);
    }

    for (const exp of contactExpenses) {
        if (!exp.contactId || !exp.contact) continue;
        const existing = marginMap.get(exp.contactId) || {
            contactName: `${exp.contact.firstName} ${exp.contact.lastName}`,
            company: exp.contact.company,
            income: 0,
            expenses: 0,
        };
        existing.expenses += Number(exp.amount);
        marginMap.set(exp.contactId, existing);
    }

    return Array.from(marginMap.entries())
        .map(([contactId, data]) => {
            const profit = data.income - data.expenses;
            const margin = data.income > 0 ? (profit / data.income) * 100 : 0;
            return {
                contactId,
                contactName: data.contactName,
                company: data.company,
                income: Math.round(data.income * 100) / 100,
                expenses: Math.round(data.expenses * 100) / 100,
                profit: Math.round(profit * 100) / 100,
                margin: Math.round(margin * 10) / 10,
            };
        })
        .sort((a, b) => b.profit - a.profit);
}
