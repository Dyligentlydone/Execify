"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInvoice } from "@/server/actions/invoices";
import type { Invoice, InvoiceItem, Contact } from "@/generated/prisma/client";

type InvoiceWithDetails = Invoice & { contact: Contact | null; items: InvoiceItem[] };

type EditItem = {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
};

export function EditInvoiceDialog({
    invoice,
    onUpdated,
}: {
    invoice: InvoiceWithDetails;
    onUpdated?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [issueDate, setIssueDate] = useState(
        invoice.issueDate
            ? new Date(invoice.issueDate).toISOString().split("T")[0]
            : ""
    );
    const [dueDate, setDueDate] = useState(
        invoice.dueDate
            ? new Date(invoice.dueDate).toISOString().split("T")[0]
            : ""
    );
    const [items, setItems] = useState<EditItem[]>(
        invoice.items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
        }))
    );

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof EditItem, value: string | number) => {
        setItems(
            items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );

    const handleSubmit = async () => {
        setLoading(true);
        const fd = new FormData();
        if (issueDate) fd.set("issueDate", issueDate);
        if (dueDate) fd.set("dueDate", dueDate);
        fd.set("items", JSON.stringify(items));

        const res = await updateInvoice(invoice.id, fd);
        setLoading(false);

        if (res?.error) {
            toast.error(
                typeof res.error === "string" ? res.error : "Failed to update invoice"
            );
        } else {
            toast.success("Invoice updated");
            setOpen(false);
            onUpdated?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex w-full items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Invoice
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Edit {invoice.invoiceNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Update invoice details and line items.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-issue-date">Issue Date</Label>
                            <Input
                                id="edit-issue-date"
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-due-date">Due Date</Label>
                            <Input
                                id="edit-due-date"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Line Items</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                                className="gap-1"
                            >
                                <Plus className="h-3 w-3" /> Add Item
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end rounded-lg border p-3"
                            >
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                        Description
                                    </Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) =>
                                            updateItem(index, "description", e.target.value)
                                        }
                                        placeholder="Item description"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Qty</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateItem(index, "quantity", Number(e.target.value))
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                        Unit Price
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                            updateItem(index, "unitPrice", Number(e.target.value))
                                        }
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length <= 1}
                                    className="text-red-400 hover:text-red-500 self-end"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {/* Subtotal */}
                        <div className="flex justify-end pt-2 border-t">
                            <div className="text-sm">
                                <span className="text-muted-foreground mr-4">Subtotal:</span>
                                <span className="font-mono font-semibold text-lg">
                                    {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                    }).format(subtotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving…" : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
