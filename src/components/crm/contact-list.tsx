"use client";

import { useState, useEffect } from "react";
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, Trash, User } from "lucide-react";
import { Contact } from "@/generated/prisma/client";
import { updateContact, deleteContact } from "@/server/actions/contacts";
import { toast } from "sonner";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";

export function ContactList({ data }: { data: Contact[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [contacts, setContacts] = useState<Contact[]>(data);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Sync contacts if data changes (e.g. revalidation)
    // useEffect(() => { setContacts(data); }, [data]); 
    // Commented out to prevent overwriting optimistic updates, relying on initial load or manual refresh if needed.

    const columns: ColumnDef<Contact>[] = [
        {
            accessorKey: "firstName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        First Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
        },
        {
            accessorKey: "lastName",
            header: "Last Name",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "company",
            header: "Company",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <Badge
                        variant={
                            status === "ACTIVE"
                                ? "default"
                                : status === "LEAD"
                                    ? "secondary"
                                    : "outline"
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
                const contact = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(contact.email || "")}
                            >
                                Copy email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSelectedContact(contact)}>View details</DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={async () => {
                                    if (!confirm("Are you sure you want to delete this contact?")) return;
                                    const result = await deleteContact(contact.id);
                                    if (result?.error) {
                                        toast.error("Failed to delete contact");
                                    } else {
                                        toast.success("Contact deleted");
                                        setContacts(prev => prev.filter(c => c.id !== contact.id));
                                    }
                                }}
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
        data: contacts,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="p-8 text-center text-muted-foreground">Loading contacts...</div>;
    }

    return (
        <>
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
                                    className="cursor-pointer"
                                    onClick={() => setSelectedContact(row.original)}
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
                <SheetContent className="sm:max-w-xl w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            Edit Contact
                        </SheetTitle>
                        <SheetDescription>
                            Update contact details and view activity.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedContact && (
                        <div className="space-y-8 pb-10">
                            <EditContactForm
                                contact={selectedContact}
                                onUpdate={(updates) => {
                                    setContacts(prev => prev.map(c =>
                                        c.id === selectedContact.id ? { ...c, ...updates } : c
                                    ));
                                    setSelectedContact(prev => prev ? { ...prev, ...updates } : null);
                                }}
                                onDelete={(id) => {
                                    setContacts(prev => prev.filter(c => c.id !== id));
                                    setSelectedContact(null);
                                }}
                            />

                            <div className="border-t pt-6">
                                <h3 className="text-sm font-semibold mb-4">Activity & Notes</h3>
                                <ActivityTimeline entityType="CONTACT" entityId={selectedContact.id} />
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

function EditContactForm({
    contact,
    onUpdate,
    onDelete
}: {
    contact: Contact;
    onUpdate: (data: Partial<Contact>) => void;
    onDelete: (id: string) => void;
}) {
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = await updateContact(contact.id, formData);

        if (result?.error) {
            toast.error("Failed to update contact");
        } else {
            toast.success("Contact updated");
            const updates = Object.fromEntries(formData.entries()) as any;
            onUpdate(updates);
        }
        setLoading(false);
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this contact?")) return;
        setLoading(true);
        const result = await deleteContact(contact.id);

        if (result?.error) {
            toast.error("Failed to delete contact");
            setLoading(false);
        } else {
            toast.success("Contact deleted");
            onDelete(contact.id);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" defaultValue={contact.firstName} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" defaultValue={contact.lastName} required />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={contact.email || ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" defaultValue={contact.company || ""} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" name="title" defaultValue={contact.title || ""} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={contact.phone || ""} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={contact.status}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="InACTIVE">Inactive</SelectItem>
                            <SelectItem value="LEAD">Lead</SelectItem>
                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
                <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Contact
                </Button>
                <Button
                    type="submit"
                    className="gold-surface text-black font-semibold"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
