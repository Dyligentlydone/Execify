"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Calculator,
    Bot,
    Download,
    Loader2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Receipt
} from "lucide-react";
import { toast } from "sonner";
import { getTaxSummary, categorizeExpensesWithAI } from "@/server/actions/tax-engine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type TaxData = Awaited<ReturnType<typeof getTaxSummary>>;

export function TaxDashboard() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<TaxData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiCategorizing, startAiTransition] = useTransition();

    const loadData = async () => {
        setIsLoading(true);
        try {
            const summary = await getTaxSummary(year);
            setData(summary);
        } catch (error) {
            toast.error("Failed to load tax data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [year]);

    const handleAutoCategorize = () => {
        startAiTransition(async () => {
            const res = await categorizeExpensesWithAI(year);
            if (res.success) {
                toast.success(`AI categorized ${res.count} expenses successfully!`);
                await loadData();
            } else {
                toast.error(res.error || "Failed to categorize");
            }
        });
    };

    const handleExportCSV = () => {
        if (!data) return;

        // Simple CSV generation for the summary
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Tax Year:,${data.year}\n`;
        csvContent += `Gross Receipts (Part I):,$${data.grossReceipts.toFixed(2)}\n`;
        csvContent += `Total Deductions (Part II):,$${data.totalDeductions.toFixed(2)}\n`;
        csvContent += `Net Profit:,$${data.netProfit.toFixed(2)}\n\n`;
        csvContent += "Itemized Deductions (Schedule C Categories)\n";
        csvContent += "Category,Amount\n";

        Object.entries(data.categories).forEach(([category, expenses]) => {
            const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
            csvContent += `"${category}",$${total.toFixed(2)}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Tax_Summary_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-primary" />
                        Tax Engine
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Automated Schedule C categorization for {year}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none"
                    >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                    </select>
                    <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {data.uncategorizedCount > 0 && (
                <Alert className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Action Required: Uncategorized Expenses</AlertTitle>
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                        <span>
                            You have <strong>{data.uncategorizedCount}</strong> expenses that have not been assigned to an IRS tax category.
                            The AI can automatically read the receipts and descriptions to map these into exactly the right Schedule C boxes.
                        </span>
                        <Button
                            onClick={handleAutoCategorize}
                            disabled={isAiCategorizing}
                            className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap gap-2"
                        >
                            {isAiCategorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                            Auto-Categorize with AI
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Gross Receipts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${data.grossReceipts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">From all paid invoices</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${data.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">Calculated from categorized expenses</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-sm border-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Est. Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">${data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-primary/80 mt-1">Taxable business income</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Schedule C Itemized Deductions</CardTitle>
                    <CardDescription>
                        Copy these exact totals into your tax software.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(data.categories).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <Receipt className="h-8 w-8 opacity-20 mx-auto mb-2" />
                                No categorized expenses found for this year.
                            </div>
                        ) : (
                            Object.entries(data.categories).map(([category, expenses]) => {
                                const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                                const isUncategorized = category === "Uncategorized";

                                return (
                                    <div key={category} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-md ${isUncategorized ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                                {isUncategorized ? <AlertCircle className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {category}
                                                    {isUncategorized && <Badge variant="destructive" className="text-[10px] h-4">Action Needed</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{expenses.length} transactions</div>
                                            </div>
                                        </div>
                                        <div className="font-mono font-medium">
                                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
