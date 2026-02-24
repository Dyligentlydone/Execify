"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { expandRecurringExpenses } from "@/lib/expense-utils";

const IRS_CATEGORIES = [
    "Advertising",
    "Car and truck expenses",
    "Commissions and fees",
    "Contract labor",
    "Depletion",
    "Depreciation",
    "Employee benefit programs",
    "Insurance (other than health)",
    "Interest - Mortgage",
    "Interest - Other",
    "Legal and professional services",
    "Office expense",
    "Pension and profit-sharing plans",
    "Rent or lease - Vehicles/machinery",
    "Rent or lease - Other business property",
    "Repairs and maintenance",
    "Supplies",
    "Taxes and licenses",
    "Travel",
    "Meals (50% limit)",
    "Utilities",
    "Wages",
    "Other expenses",
] as const;

export type IRSCategory = typeof IRS_CATEGORIES[number];

export async function getTaxSummary(year: number) {
    const user = await requireRole("VIEWER");

    const org = await db.organization.findUnique({
        where: { id: user.organizationId! },
        select: { taxProfile: true, customTaxRate: true }
    });

    // 1. Get Gross Receipts (Paid Invoices)
    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    const paidInvoices = await db.invoice.aggregate({
        where: {
            organizationId: user.organizationId!,
            status: "PAID",
            paidAt: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            total: true
        }
    });

    const grossReceipts = Number(paidInvoices._sum.total || 0);

    // 2. Get All Expenses for the year
    const rawExpenses = await db.expense.findMany({
        where: {
            organizationId: user.organizationId!,
            OR: [
                { type: "ONE_TIME", date: { gte: startDate, lte: endDate } },
                { type: "RECURRING", isActive: true, date: { lte: endDate } }
            ]
        }
    });

    // For taxes, we always want to project the full year's recurring expenses
    // to give the user a complete annual estimate.
    const expenses = expandRecurringExpenses(rawExpenses, startDate, endDate);

    // Group expenses by Tax Category
    const categorizedExpenses: Record<string, typeof expenses> = {
        "Uncategorized": []
    };

    for (const cat of IRS_CATEGORIES) {
        categorizedExpenses[cat] = [];
    }

    let totalDeductions = 0;

    for (const exp of expenses) {
        if (!exp.taxCategory) {
            categorizedExpenses["Uncategorized"].push(exp);
        } else if (exp.taxCategory && IRS_CATEGORIES.includes(exp.taxCategory as IRSCategory)) {
            categorizedExpenses[exp.taxCategory].push(exp);

            // Handle 50% limit for Meals
            if (exp.taxCategory === "Meals (50% limit)") {
                totalDeductions += Number(exp.amount) * 0.5;
            } else {
                totalDeductions += Number(exp.amount);
            }
        } else {
            categorizedExpenses["Other expenses"].push(exp);
            totalDeductions += Number(exp.amount);
        }
    }

    const netProfit = grossReceipts - totalDeductions;

    // Filter out empty arrays and map to plain objects to fix Decimal serialization error
    const activeCategories = Object.fromEntries(
        Object.entries(categorizedExpenses)
            .filter(([, exps]) => exps.length > 0)
            .map(([cat, exps]) => [
                cat,
                exps.map((e) => ({
                    ...e,
                    amount: Number(e.amount)
                }))
            ])
    );

    return {
        year,
        grossReceipts,
        totalDeductions,
        netProfit,
        categories: activeCategories,
        uncategorizedCount: categorizedExpenses["Uncategorized"].length,
        savedProfile: org?.taxProfile || "standard",
        savedCustomRate: org?.customTaxRate || 30
    };
}

export async function categorizeExpensesWithAI(year: number) {
    const user = await requireRole("MANAGER"); // Only managers+ can modify

    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    const uncategorized = await db.expense.findMany({
        where: {
            organizationId: user.organizationId!,
            date: { gte: startDate, lte: endDate },
            taxCategory: null
        },
        take: 50 // process in batches of 50
    });

    if (uncategorized.length === 0) {
        return { success: true, count: 0 };
    }

    try {
        const payload = uncategorized.map(e => ({
            id: e.id,
            description: e.description,
            vendor: e.vendor || "Unknown",
            category: e.category,
            amount: Number(e.amount)
        }));

        const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
                results: z.array(z.object({
                    id: z.string(),
                    taxCategory: z.enum(IRS_CATEGORIES)
                }))
            }),
            prompt: `You are an expert CPA classifying business expenses for an IRS Schedule C tax form. 
            Review the following list of expenses and map each one to the absolute most appropriate IRS tax category.
            Expenses: ${JSON.stringify(payload)}`
        });

        // Update database
        let updatedCount = 0;
        for (const res of object.results) {
            await db.expense.update({
                where: { id: res.id, organizationId: user.organizationId! },
                data: { taxCategory: res.taxCategory }
            });
            updatedCount++;
        }

        return { success: true, count: updatedCount };
    } catch (e: unknown) {
        console.error("AI Categorization Error", e);
        return { success: false, error: "Failed to categorize expenses." };
    }
}

export async function saveTaxProfile(taxProfile: string, customTaxRate: number | null) {
    const user = await requireRole("MANAGER");

    await db.organization.update({
        where: { id: user.organizationId! },
        data: {
            taxProfile,
            customTaxRate
        }
    });

    return { success: true };
}
