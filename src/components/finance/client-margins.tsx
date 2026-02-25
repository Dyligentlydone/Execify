"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Users, Info } from "lucide-react";
import type { ClientMargin } from "@/server/actions/financials";
import { getClientMargins } from "@/server/actions/financials";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export function ClientMarginsSection({
    startDate,
    endDate,
}: {
    startDate: string;
    endDate: string;
}) {
    const [margins, setMargins] = useState<ClientMargin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getClientMargins(startDate, endDate)
            .then(setMargins)
            .finally(() => setLoading(false));
    }, [startDate, endDate]);

    if (loading) {
        return (
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        Client Margins
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[250px]">
                                    <p>Shows actual profitability per client based strictly on <b>Paid</b> invoices minus incurred expenses. <b>Projected income is not included.</b></p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </h3>
                </div>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Client Margins
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px] leading-relaxed">
                                <p>Shows actual profitability per client based strictly on <b>Paid</b> invoices minus incurred expenses. <b>Projected income is not included.</b></p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                    Profit per client
                </span>
            </div>

            {margins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No client data for this period.</p>
                    <p className="text-xs mt-1">
                        Link expenses to clients and create paid invoices to see margins.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_100px_100px_100px_70px] gap-2 text-xs text-muted-foreground font-medium px-3 pb-1 border-b">
                        <span>Client</span>
                        <span className="text-right">Income</span>
                        <span className="text-right">Expenses</span>
                        <span className="text-right">Profit</span>
                        <span className="text-right">Margin</span>
                    </div>

                    {margins.map((client) => (
                        <div
                            key={client.contactId}
                            className="grid grid-cols-[1fr_100px_100px_100px_70px] gap-2 items-center px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            {/* Client Name */}
                            <div>
                                <div className="font-medium text-sm truncate">
                                    {client.contactName}
                                </div>
                                {client.company && (
                                    <div className="text-xs text-muted-foreground truncate">
                                        {client.company}
                                    </div>
                                )}
                            </div>

                            {/* Income */}
                            <div className="text-right text-sm font-mono text-green-400">
                                {formatCurrency(client.income)}
                            </div>

                            {/* Expenses */}
                            <div className="text-right text-sm font-mono text-red-400">
                                {formatCurrency(client.expenses)}
                            </div>

                            {/* Profit */}
                            <div
                                className={`text-right text-sm font-mono font-semibold flex items-center justify-end gap-1 ${client.profit >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                    }`}
                            >
                                {client.profit >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                {formatCurrency(Math.abs(client.profit))}
                            </div>

                            {/* Margin */}
                            <div className="text-right">
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${client.margin >= 50
                                        ? "bg-green-500/20 text-green-400"
                                        : client.margin >= 20
                                            ? "bg-yellow-500/20 text-yellow-400"
                                            : client.margin >= 0
                                                ? "bg-orange-500/20 text-orange-400"
                                                : "bg-red-500/20 text-red-400"
                                        }`}
                                >
                                    {client.margin}%
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Totals row */}
                    <div className="grid grid-cols-[1fr_100px_100px_100px_70px] gap-2 items-center px-3 py-3 rounded-lg bg-muted/30 border-t mt-1 font-semibold text-sm">
                        <span>Total ({margins.length} clients)</span>
                        <span className="text-right font-mono text-green-400">
                            {formatCurrency(
                                margins.reduce((s, c) => s + c.income, 0)
                            )}
                        </span>
                        <span className="text-right font-mono text-red-400">
                            {formatCurrency(
                                margins.reduce((s, c) => s + c.expenses, 0)
                            )}
                        </span>
                        <span className="text-right font-mono text-green-400">
                            {formatCurrency(
                                margins.reduce((s, c) => s + c.profit, 0)
                            )}
                        </span>
                        <span className="text-right text-xs">
                            {(() => {
                                const totalIncome = margins.reduce(
                                    (s, c) => s + c.income,
                                    0
                                );
                                const totalProfit = margins.reduce(
                                    (s, c) => s + c.profit,
                                    0
                                );
                                const avgMargin =
                                    totalIncome > 0
                                        ? Math.round(
                                            (totalProfit / totalIncome) * 1000
                                        ) / 10
                                        : 0;
                                return `${avgMargin}%`;
                            })()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
