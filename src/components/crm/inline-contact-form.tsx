"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createContact } from "@/server/actions/contacts";
import type { Contact } from "@/generated/prisma/client";

const contactSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    company: z.string().optional(),
    title: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "LEAD", "CUSTOMER"]).default("CUSTOMER"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface InlineContactFormProps {
    onSuccess: (contact: Contact) => void;
    onCancel: () => void;
}

export function InlineContactForm({ onSuccess, onCancel }: InlineContactFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema) as any,
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            company: "",
            title: "",
            status: "CUSTOMER",
        },
    });

    async function handleCreate() {
        // Trigger validation manually
        const isValid = await form.trigger();
        if (!isValid) return;

        const data = form.getValues();
        setLoading(true);

        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value) formData.append(key, value);
            });

            const result = await createContact(formData);

            if (result?.success && result.data) {
                toast.success("Customer created successfully");
                // Serialize through JSON to strip Prisma special types (Decimal, Date objects)
                const plainContact = JSON.parse(JSON.stringify(result.data)) as Contact;
                onSuccess(plainContact);
            } else {
                toast.error(typeof result?.error === "string" ? result.error : "Failed to create customer");
            }
        } catch (err) {
            toast.error("Failed to create customer");
            console.error("Inline contact creation error:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">New Customer Information</h4>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel} type="button">
                    <X className="h-3 w-3" />
                </Button>
            </div>

            <Form {...form}>
                {/* Use a div instead of <form> to prevent nested form submission bubbling */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">First Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John" {...field} className="h-8 text-sm" />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Last Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Doe" {...field} className="h-8 text-sm" />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="john@example.com" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Company</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Inc." {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" type="button" onClick={onCancel} className="h-8 text-xs">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={loading}
                            className="h-8 text-xs"
                            onClick={handleCreate}
                        >
                            {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Create & Select
                        </Button>
                    </div>
                </div>
            </Form>
        </div>
    );
}
