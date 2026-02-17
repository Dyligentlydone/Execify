"use client";

import { useState, useEffect, useTransition } from "react";
import { format, startOfYear } from "date-fns";
import { Loader2, BarChart3, Receipt, DollarSign, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/finance/date-range-picker";
import { PnLOverview } from "@/components/finance/pnl-overview";
import { ExpenseList } from "@/components/finance/expense-list";
import { IncomeList } from "@/components/finance/income-list";
import { CreateExpenseDialog } from "@/components/finance/create-expense-dialog";
import { ClientMarginsSection } from "@/components/finance/client-margins";
import { getPnLData, type PnLData } from "@/server/actions/financials";
import { getExpenses } from "@/server/actions/expenses";

function getDefaultRange() {
    const now = new Date();
    return {
        label: "Year to Date",
        startDate: format(startOfYear(now), "yyyy-MM-dd"),
        endDate: format(now, "yyyy-MM-dd"),
    };
}

export function FinancialsClient() {
    const [dateRange, setDateRange] = useState(getDefaultRange());
    const [pnlData, setPnlData] = useState<PnLData | null>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const [initialLoad, setInitialLoad] = useState(true);

    const fetchData = async () => {
        startTransition(async () => {
            const [pnl, exp] = await Promise.all([
                getPnLData(dateRange.startDate, dateRange.endDate),
                getExpenses(dateRange.startDate, dateRange.endDate),
            ]);
            setPnlData(pnl);
            setExpenses(exp);
            setInitialLoad(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    if (initialLoad) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Financials
                    </h2>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Track your P&L, expenses, and income across any time period.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                    <CreateExpenseDialog />
                </div>
            </div>

            {/* Loading overlay when switching periods */}
            {isPending && !initialLoad && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating data…
                </div>
            )}

            {/* Tab layout */}
            <Tabs defaultValue="pnl" className="w-full space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="pnl" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <BarChart3 className="h-4 w-4" />
                        P&L Overview
                    </TabsTrigger>
                    <TabsTrigger value="expenses" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Receipt className="h-4 w-4" />
                        Expenses
                    </TabsTrigger>
                    <TabsTrigger value="income" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <DollarSign className="h-4 w-4" />
                        Income
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pnl" className="space-y-4 border-none p-0 outline-none">
                    {pnlData && <PnLOverview data={pnlData} />}
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4 border-none p-0 outline-none">
                    <ExpenseList data={expenses} />
                </TabsContent>

                <TabsContent value="income" className="space-y-4 border-none p-0 outline-none">
                    {pnlData && <IncomeList data={pnlData.recentIncome} />}
                </TabsContent>
            </Tabs>

            {/* Client Margins */}
            <ClientMarginsSection
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
            />
        </div>
    );
}
