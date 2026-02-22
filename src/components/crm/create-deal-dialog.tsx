"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createDeal } from "@/server/actions/deals";
import { DealStage, Contact } from "@/generated/prisma/client";

interface CreateDealDialogProps {
    stages: DealStage[];
    contacts: Contact[];
    isReadOnly?: boolean;
}

import { InlineContactForm } from "./inline-contact-form";

export function CreateDealDialog({ stages, contacts, isReadOnly }: CreateDealDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [localContacts, setLocalContacts] = useState<Contact[]>(contacts);
    const [selectedContactId, setSelectedContactId] = useState<string>("");

    // Sync local contacts if prop changes
    useEffect(() => {
        setLocalContacts(contacts);
    }, [contacts]);

    const handleContactCreated = (newContact: Contact) => {
        setLocalContacts(prev => [newContact, ...prev]);
        setSelectedContactId(newContact.id);
        setShowContactForm(false);
    };

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createDeal(formData);

        if (result?.error) {
            if (typeof result.error === "string") {
                toast.error(result.error);
            } else {
                toast.error("Please check the form for errors");
            }
        } else {
            toast.success("Deal created successfully");
            setOpen(false);
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
                setShowContactForm(false);
                setSelectedContactId("");
            }
        }}>
            <DialogTrigger asChild>
                <Button className="gold-action-button" disabled={isReadOnly}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Deal</DialogTitle>
                    <DialogDescription>
                        Create a new deal in your pipeline.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Deal Title</Label>
                        <Input id="title" name="title" placeholder="New Website Project" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="value">Value ($)</Label>
                            <Input
                                id="value"
                                name="value"
                                type="number"
                                placeholder="5000"
                                step="0.01"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="stageId">Stage</Label>
                            <Select name="stageId" defaultValue={stages[0]?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stages.map((stage) => (
                                        <SelectItem key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="contactId">Contact (Optional)</Label>
                            <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-xs text-primary"
                                onClick={() => setShowContactForm(!showContactForm)}
                            >
                                {showContactForm ? "Cancel new contact" : "+ New contact"}
                            </Button>
                        </div>

                        {!showContactForm ? (
                            <Select
                                name="contactId"
                                value={selectedContactId}
                                onValueChange={setSelectedContactId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select contact" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">None</SelectItem>
                                    {localContacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            {contact.firstName} {contact.lastName}
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
                        {/* Hidden input to ensure contactId is submitted with the form if using Select controlled state */}
                        <input type="hidden" name="contactId" value={selectedContactId} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                        <Input
                            id="expectedCloseDate"
                            name="expectedCloseDate"
                            type="date"
                        />
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
                            Create Deal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
