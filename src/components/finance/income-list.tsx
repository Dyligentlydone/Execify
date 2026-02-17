"use client";

import { format } from "date-fns";
import { DollarSign, User as UserIcon } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type IncomeRow = {
    id: string;
    invoiceNumber: string;
    contactName: string;
    amount: number;
    paidAt: string | null;
};

export function IncomeList({ data }: { data: IncomeRow[] }) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="font-semibold text-foreground/70">Date Paid</TableHead>
                        <TableHead className="font-semibold text-foreground/70">Invoice #</TableHead>
                        <TableHead className="font-semibold text-foreground/70">Customer</TableHead>
                        <TableHead className="font-semibold text-foreground/70">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                    {row.paidAt ? format(new Date(row.paidAt), "MMM d, yyyy") : "—"}
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm font-medium">{row.invoiceNumber}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center text-sm">
                                        <UserIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                                        {row.contactName}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono font-medium text-emerald-500">
                                        +{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.amount)}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <DollarSign className="h-8 w-8 opacity-20" />
                                    <p>No paid invoices found for this period.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
