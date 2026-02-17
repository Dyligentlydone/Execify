"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    MoreHorizontal,
    Pause,
    Play,
    Calendar,
    Clock,
    Hash,
    User as UserIcon,
    ArrowRight
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { RecurringInvoice, Contact, RecurringInvoiceItem } from "@/generated/prisma/client";
import { pauseRecurringInvoice } from "@/server/actions/recurring-invoices";

type RecurringWithDetails = RecurringInvoice & {
    contact: Contact | null;
    items: RecurringInvoiceItem[];
};

export function RecurringInvoiceList({ data }: { data: RecurringWithDetails[] }) {
    const [templates, setTemplates] = useState(data);

    const handleToggleStatus = async (template: RecurringWithDetails) => {
        const isPaused = template.status === "PAUSED";
        const newStatus = isPaused ? "ACTIVE" : "PAUSED";

        // Optimistic update
        setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, status: newStatus as any } : t));

        const res = await pauseRecurringInvoice(template.id, !isPaused);
        if (res?.error) {
            toast.error("Failed to update status");
            setTemplates(data); // Revert
        } else {
            toast.success(isPaused ? "Subscription resumed" : "Subscription paused");
        }
    };

    const columns: ColumnDef<RecurringWithDetails>[] = [
        {
            accessorKey: "name",
            header: "Plan Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{row.original.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center">
                        <RepeatIcon className="h-3 w-3 mr-1" />
                        Every {row.original.interval} {row.original.frequency.toLowerCase()}(s)
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "contact",
            header: "Customer",
            cell: ({ row }) => {
                const contact = row.original.contact;
                return contact ? (
                    <div className="flex items-center text-sm">
                        <UserIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                        {contact.firstName} {contact.lastName}
                    </div>
                ) : <span className="text-muted-foreground">-</span>;
            },
        },
        {
            accessorKey: "total",
            header: "Recurring Amount",
            cell: ({ row }) => {
                const amount = Number(row.original.total);
                return (
                    <div className="font-mono font-medium">
                        {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                        }).format(amount)}
                    </div>
                );
            },
        },
        {
            accessorKey: "nextRunDate",
            header: "Next Invoice",
            cell: ({ row }) => (
                <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-2" />
                    {format(new Date(row.original.nextRunDate), "MMM d, yyyy")}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge
                        variant={status === "ACTIVE" ? "default" : "outline"}
                        className={status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                        {status}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const template = row.original;
                const isPaused = template.status === "PAUSED";

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Template Options</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleToggleStatus(template)}>
                                {isPaused ? (
                                    <>
                                        <Play className="mr-2 h-4 w-4 text-green-500" /> Resume Billing
                                    </>
                                ) : (
                                    <>
                                        <Pause className="mr-2 h-4 w-4 text-amber-500" /> Pause Billing
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">
                                Stop Subscription
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: templates,
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
                                    <Calendar className="h-8 w-8 opacity-20" />
                                    <p>No recurring billing plans found.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function RepeatIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m17 2 4 4-4 4" />
            <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="m7 22-4-4 4-4" />
            <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
    );
}
