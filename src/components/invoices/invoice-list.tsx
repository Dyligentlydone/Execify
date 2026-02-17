"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, CheckCircle, XCircle, Send, Ban } from "lucide-react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
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
import type { Invoice, Contact, InvoiceStatus, InvoiceItem } from "@/generated/prisma/client";
import { updateInvoiceStatus, deleteInvoice } from "@/server/actions/invoices";

type InvoiceWithDetails = Invoice & { contact: Contact | null, items: InvoiceItem[] };

export function InvoiceList({ data }: { data: InvoiceWithDetails[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [invoices, setInvoices] = useState(data);

    const handleDelete = async (invoice: InvoiceWithDetails) => {
        // Optimistic delete
        const oldInvoices = invoices;
        setInvoices(prev => prev.filter(i => i.id !== invoice.id));

        const res = await deleteInvoice(invoice.id);
        if (res?.error) {
            toast.error("Failed to delete invoice");
            setInvoices(oldInvoices);
        } else {
            toast.success("Invoice deleted");
        }
    };

    const handleStatusUpdate = async (invoice: InvoiceWithDetails, status: InvoiceStatus) => {
        const oldStatus = invoice.status;
        setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status } : i));

        const res = await updateInvoiceStatus(invoice.id, status);
        if (res?.error) {
            toast.error("Failed to update status");
            setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: oldStatus } : i));
        } else {
            toast.success(`Invoice status updated to ${status}`);
        }
    };

    const columns: ColumnDef<InvoiceWithDetails>[] = [
        {
            accessorKey: "invoiceNumber",
            header: "Invoice #",
            cell: ({ row }) => <span className="font-mono">{row.original.invoiceNumber}</span>,
        },
        {
            accessorKey: "contact",
            header: "Customer",
            cell: ({ row }) => {
                const contact = row.original.contact;
                return contact ? (
                    <div className="font-medium">
                        {contact.firstName} {contact.lastName}
                    </div>
                ) : <span className="text-muted-foreground">-</span>;
            },
        },
        {
            accessorKey: "total",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const amount = Number(row.original.total);
                const formatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount);
                return <div className="font-medium">{formatted}</div>;
            },
        },
        {
            accessorKey: "dueDate",
            header: "Due Date",
            cell: ({ row }) => {
                const date = row.original.dueDate;
                return date ? <div className="text-muted-foreground">{format(new Date(date), "MMM d, yyyy")}</div> : <span>-</span>;
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge
                        variant={
                            status === "PAID"
                                ? "default"
                                : status === "SENT"
                                    ? "secondary"
                                    : status === "OVERDUE"
                                        ? "destructive"
                                        : "outline"
                        }
                        className={
                            status === "PAID" ? "bg-green-500 hover:bg-green-600" :
                                status === "SENT" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
                        }
                    >
                        {status}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const invoice = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invoice.invoiceNumber)}>
                                Copy Invoice ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === "DRAFT" && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(invoice, "SENT")}>
                                    <Send className="mr-2 h-4 w-4 text-blue-500" /> Mark as Sent
                                </DropdownMenuItem>
                            )}
                            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(invoice, "PAID")}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Mark as Paid
                                </DropdownMenuItem>
                            )}
                            {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(invoice, "CANCELLED")}>
                                    <Ban className="mr-2 h-4 w-4 text-muted-foreground" /> Cancel Invoice
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={() => handleDelete(invoice)}
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: invoices,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
