"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Upload, X, Repeat, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createExpense } from "@/server/actions/expenses";
import { getContacts } from "@/server/actions/contacts";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

const formSchema = z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.string().min(1, "Amount is required"),
    date: z.string().min(1, "Date is required"),
    type: z.enum(["ONE_TIME", "RECURRING"]),
    category: z.string().min(1, "Category is required"),
    customCategory: z.string().optional(),
    vendor: z.string().optional(),
    contactId: z.string().optional(),
    notes: z.string().optional(),
    frequency: z.string().optional(),
    interval: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateExpenseDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptName, setReceiptName] = useState<string | null>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getContacts({ limit: 100 }).then((res) => setContacts(res?.data || []));
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            amount: "",
            date: new Date().toISOString().split("T")[0],
            type: "ONE_TIME",
            category: "",
            customCategory: "",
            vendor: "",
            contactId: "",
            notes: "",
            frequency: "MONTHLY",
            interval: "1",
        },
    });

    const expenseType = form.watch("type");
    const selectedCategory = form.watch("category");

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingReceipt(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload/receipt", { method: "POST", body: formData });
            const data = await res.json();

            if (data.success && data.url) {
                setReceiptUrl(data.url);
                setReceiptName(file.name);
                toast.success("Receipt uploaded");
            } else {
                toast.error(data.error || "Upload failed");
            }
        } catch {
            toast.error("Upload failed");
        } finally {
            setUploadingReceipt(false);
        }
    };

    async function onSubmit(values: FormValues) {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("description", values.description);
            formData.append("amount", values.amount);
            formData.append("date", values.date);
            formData.append("type", values.type);
            formData.append("category", values.category === "custom" ? (values.customCategory || "Other") : values.category);
            if (values.vendor) formData.append("vendor", values.vendor);
            if (values.contactId) formData.append("contactId", values.contactId);
            if (values.notes) formData.append("notes", values.notes);
            if (receiptUrl) formData.append("receiptUrl", receiptUrl);

            if (values.type === "RECURRING") {
                formData.append("frequency", values.frequency || "MONTHLY");
                formData.append("interval", values.interval || "1");
            }

            const result = await createExpense(formData);

            if (result?.success) {
                toast.success("Expense created");
                form.reset();
                setReceiptUrl(null);
                setReceiptName(null);
                setOpen(false);
            } else {
                toast.error(typeof result?.error === "string" ? result.error : "Failed to create expense");
            }
        } catch {
            toast.error("Failed to create expense");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset(); setReceiptUrl(null); setReceiptName(null); } }}>
            <DialogTrigger asChild>
                <Button className="gold-action-button gap-2">
                    <Plus className="h-4 w-4" />
                    Add Expense
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">New Expense</DialogTitle>
                    <DialogDescription>Track a one-time or recurring expense.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Office rent, software license, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Amount */}
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Date */}
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Category */}
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[300px]">
                                                {EXPENSE_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="custom">+ Custom Category</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Vendor */}
                            <FormField
                                control={form.control}
                                name="vendor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor / Payee</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Company name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Client / Contact */}
                        <FormField
                            control={form.control}
                            name="contactId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5" /> Client / Customer (optional)
                                    </FormLabel>
                                    <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="No client linked" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-[250px]">
                                            <SelectItem value="none">None</SelectItem>
                                            {contacts.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.firstName} {c.lastName}{c.company ? ` (${c.company})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Custom Category */}
                        {selectedCategory === "custom" && (
                            <FormField
                                control={form.control}
                                name="customCategory"
                                render={({ field }) => (
                                    <FormItem className="animate-in fade-in slide-in-from-top-1">
                                        <FormLabel>Custom Category Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter custom category" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Expense Type Toggle */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={field.value === "ONE_TIME" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => field.onChange("ONE_TIME")}
                                            className={`flex-1 ${field.value === "ONE_TIME" ? "gold-surface border-0 text-black hover:opacity-90" : ""}`}
                                        >
                                            One-time
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={field.value === "RECURRING" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => field.onChange("RECURRING")}
                                            className={`flex-1 gap-1 ${field.value === "RECURRING" ? "gold-surface border-0 text-black hover:opacity-90" : ""}`}
                                        >
                                            <Repeat className="h-3 w-3" /> Recurring
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Recurring fields */}
                        {expenseType === "RECURRING" && (
                            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border bg-muted/30 animate-in fade-in slide-in-from-top-1">
                                <FormField
                                    control={form.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Frequency</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DAILY">Daily</SelectItem>
                                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                    <SelectItem value="YEARLY">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="interval"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Every X periods</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Optional notes..." rows={2} {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Receipt Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Receipt / Document</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleReceiptUpload}
                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                className="hidden"
                            />
                            {!receiptUrl ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-20 border-dashed gap-2"
                                    disabled={uploadingReceipt}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploadingReceipt ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><Upload className="h-4 w-4" /> Upload Receipt (PNG, JPG, PDF, max 5MB)</>
                                    )}
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                                    <Upload className="h-4 w-4 text-primary" />
                                    <span className="text-sm flex-1 truncate">{receiptName}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => { setReceiptUrl(null); setReceiptName(null); }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="gold-surface border-0 text-black hover:opacity-90 transition-all font-semibold"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Expense
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
