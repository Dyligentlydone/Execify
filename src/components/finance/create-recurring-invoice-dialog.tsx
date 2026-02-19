"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash, Calculator, Calendar, Repeat, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createRecurringInvoice } from "@/server/actions/recurring-invoices";
import type { Contact } from "@/generated/prisma/client";
import { InlineContactForm } from "@/components/crm/inline-contact-form";

const RECURRING_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

const recurringItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().min(0, "Price must be positive"),
});

const createRecurringSchema = z.object({
    name: z.string().min(1, "Template name is required"),
    contactId: z.string().min(1, "Customer is required"),
    frequency: z.enum(RECURRING_FREQUENCIES),
    interval: z.coerce.number().min(1),
    startDate: z.string().min(1, "Start date is required"),
    items: z.array(recurringItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional(),
});

type RecurringFormValues = z.infer<typeof createRecurringSchema>;

export function CreateRecurringInvoiceDialog({ contacts }: { contacts: Contact[] }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [localContacts, setLocalContacts] = useState<Contact[]>(contacts);

    // Sync local contacts if prop changes
    useEffect(() => {
        setLocalContacts(contacts);
    }, [contacts]);

    const form = useForm<RecurringFormValues>({
        resolver: zodResolver(createRecurringSchema) as any,
        defaultValues: {
            name: "",
            contactId: "",
            frequency: "MONTHLY",
            interval: 1,
            startDate: new Date().toISOString().split("T")[0],
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
            notes: "",
        },
    });

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control,
    });

    const items = form.watch("items");
    const total = items?.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0) || 0;

    async function onSubmit(data: RecurringFormValues) {
        setLoading(true);

        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("contactId", data.contactId);
        formData.append("frequency", data.frequency);
        formData.append("interval", data.interval.toString());
        formData.append("startDate", data.startDate);
        formData.append("items", JSON.stringify(data.items));
        if (data.notes) formData.append("notes", data.notes);

        const result = await createRecurringInvoice(formData);

        if (result?.error) {
            toast.error(typeof result.error === "string" ? result.error : "Failed to create template");
        } else {
            toast.success("Recurring template created successfully");
            setOpen(false);
            form.reset();
        }

        setLoading(false);
    }

    const handleContactCreated = (newContact: Contact) => {
        setLocalContacts(prev => [newContact, ...prev]);
        form.setValue("contactId", newContact.id);
        setShowContactForm(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
                setShowContactForm(false);
                form.reset();
            }
        }}>
            <DialogTrigger asChild>
                <Button className="gold-action-button">
                    <Repeat className="h-4 w-4 mr-2" />
                    Setup Recurring
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Setup Recurring Invoice</DialogTitle>
                    <DialogDescription>
                        Create a template that automatically generates invoices on a schedule.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Template Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Monthly Retainer - Acme Corp" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="contactId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Customer</FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="h-auto p-0 text-xs text-primary"
                                                    onClick={() => setShowContactForm(!showContactForm)}
                                                >
                                                    {showContactForm ? "Cancel new customer" : "+ New customer"}
                                                </Button>
                                            </div>
                                            {!showContactForm ? (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select customer" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {localContacts.map((contact) => (
                                                            <SelectItem key={contact.id} value={contact.id}>
                                                                {contact.firstName} {contact.lastName} {contact.company ? `(${contact.company})` : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <InlineContactForm
                                                    onSuccess={handleContactCreated}
                                                    onCancel={() => setShowContactForm(false)}
                                                />
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 md:col-span-1">
                                        <FormLabel>First Invoice Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequency</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="DAILY">Daily</SelectItem>
                                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                <SelectItem value="YEARLY">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="interval"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interval (Every X)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 rounded-xl border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Line Items</h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                                    className="h-8 border-dashed"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-start animate-in slide-in-from-right-2 duration-200">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input placeholder="Description" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-24">
                                                    <FormControl>
                                                        <Input type="number" placeholder="Qty" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unitPrice`}
                                            render={({ field }) => (
                                                <FormItem className="w-32">
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="Price" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4 mt-2 border-t border-dashed">
                                <div className="bg-muted px-4 py-2 rounded-lg">
                                    <div className="flex items-center gap-3 text-lg font-bold text-primary">
                                        <Calculator className="h-5 w-5 text-muted-foreground" />
                                        <span>Recurring Total:</span>
                                        <span>
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            }).format(total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || showContactForm}
                                className="min-w-[180px] gold-surface border-0 text-black hover:opacity-90 transition-all font-semibold"
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Repeat className="mr-2 h-4 w-4" />
                                )}
                                Start Recurring Billing
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
