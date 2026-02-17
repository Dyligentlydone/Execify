"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import type { PnLData } from "@/server/actions/financials";
import { EXPENSE_CATEGORIES, getCategoryLabel } from "@/lib/expense-categories";

const CHART_COLORS = [
    "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6",
    "#10b981", "#22c55e", "#84cc16", "#eab308", "#f97316",
    "#ef4444", "#ec4899", "#a855f7", "#7c3aed", "#2563eb",
    "#0891b2", "#059669", "#65a30d", "#ca8a04", "#dc2626",
    "#9333ea",
];


function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatMonth(month: string): string {
    const [year, m] = month.split("-");
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

type Props = {
    data: PnLData;
};

export function PnLOverview({ data }: Props) {
    const isProfit = data.netProfitLoss >= 0;
    const chartData = data.monthlyBreakdown.map(d => ({
        ...d,
        month: formatMonth(d.month),
    }));

    const pieData = data.expensesByCategory.map((cat, i) => ({
        name: getCategoryLabel(cat.category),
        value: Math.round(cat.total * 100) / 100,
        fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue */}
                <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                            <p className="text-3xl font-bold text-emerald-500 mt-1">
                                {formatCurrency(data.revenue)}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                            <ArrowUpRight className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        From {data.recentIncome.length} paid invoice{data.recentIncome.length !== 1 ? "s" : ""}
                    </p>
                </Card>

                {/* Expenses */}
                <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                            <p className="text-3xl font-bold text-red-500 mt-1">
                                {formatCurrency(data.expenses)}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                            <ArrowDownRight className="h-6 w-6 text-red-500" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Across {data.expensesByCategory.length} categor{data.expensesByCategory.length !== 1 ? "ies" : "y"}
                    </p>
                </Card>

                {/* Net P&L */}
                <Card className={`p-6 bg-gradient-to-br ${isProfit ? "from-indigo-500/10 to-purple-600/5 border-indigo-500/20" : "from-orange-500/10 to-red-600/5 border-orange-500/20"}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Net Profit / Loss</p>
                            <p className={`text-3xl font-bold mt-1 ${isProfit ? "text-indigo-500" : "text-orange-500"}`}>
                                {isProfit ? "+" : ""}{formatCurrency(data.netProfitLoss)}
                            </p>
                        </div>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isProfit ? "bg-indigo-500/10" : "bg-orange-500/10"}`}>
                            {isProfit ? (
                                <TrendingUp className="h-6 w-6 text-indigo-500" />
                            ) : (
                                <TrendingDown className="h-6 w-6 text-orange-500" />
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {isProfit ? "You're in the green" : "Expenses exceed revenue"}
                    </p>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Revenue vs Expenses Bar Chart */}
                <Card className="p-6 lg:col-span-3">
                    <h3 className="text-lg font-semibold mb-1">Revenue vs Expenses</h3>
                    <p className="text-xs text-muted-foreground mb-4">Monthly comparison</p>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                />
                                <YAxis
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                    }}
                                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0)]}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <DollarSign className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                <p>No data for this period</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Expense Breakdown Donut */}
                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-1">Expense Breakdown</h3>
                    <p className="text-xs text-muted-foreground mb-4">By category</p>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                    }}
                                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0)]}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: "11px", paddingTop: "16px" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[320px] items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <DollarSign className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                <p>No expenses recorded</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
