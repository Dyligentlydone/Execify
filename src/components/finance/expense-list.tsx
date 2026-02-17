"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    MoreHorizontal,
    Trash2,
    Receipt,
    ExternalLink,
    Repeat,
    CreditCard,
} from "lucide-react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { deleteExpense } from "@/server/actions/expenses";
import { EXPENSE_CATEGORIES, getCategoryLabel } from "@/lib/expense-categories";

type ExpenseRow = {
    id: string;
    description: string;
    amount: string | number;
    date: string;
    type: string;
    category: string;
    vendor: string | null;
    receiptUrl: string | null;
    frequency: string | null;
    interval: number | null;
};


export function ExpenseList({ data }: { data: ExpenseRow[] }) {
    const [expenses, setExpenses] = useState(data);

    const handleDelete = async (expense: ExpenseRow) => {
        if (!confirm(`Delete "${expense.description}"?`)) return;

        setExpenses(prev => prev.filter(e => e.id !== expense.id));

        const res = await deleteExpense(expense.id);
        if (res?.error) {
            toast.error(typeof res.error === "string" ? res.error : "Failed to delete");
            setExpenses(data);
        } else {
            toast.success("Expense deleted");
        }
    };

    const columns: ColumnDef<ExpenseRow>[] = [
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(row.original.date), "MMM d, yyyy")}
                </span>
            ),
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.description}</span>
                    {row.original.vendor && (
                        <span className="text-xs text-muted-foreground">{row.original.vendor}</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {getCategoryLabel(row.original.category)}
                </Badge>
            ),
        },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => (
                <span className="font-mono font-medium text-red-500">
                    -{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(row.original.amount))}
                </span>
            ),
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const isRecurring = row.original.type === "RECURRING";
                return (
                    <Badge
                        variant={isRecurring ? "default" : "secondary"}
                        className={`text-xs ${isRecurring ? "bg-purple-500 hover:bg-purple-600" : ""}`}
                    >
                        {isRecurring ? (
                            <><Repeat className="h-3 w-3 mr-1" /> Recurring</>
                        ) : (
                            <><CreditCard className="h-3 w-3 mr-1" /> One-time</>
                        )}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "receiptUrl",
            header: "Receipt",
            cell: ({ row }) => {
                const url = row.original.receiptUrl;
                return url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <ExternalLink className="h-3 w-3" /> View
                    </a>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => handleDelete(row.original)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const table = useReactTable({
        data: expenses,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="font-semibold text-foreground/70">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <Receipt className="h-8 w-8 opacity-20" />
                                    <p>No expenses found for this period.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
