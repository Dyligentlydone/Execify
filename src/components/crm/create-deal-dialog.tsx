"use client";

import { useState } from "react";
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
    contacts?: Contact[]; // Optional for now, can implement later
}

export function CreateDealDialog({ stages }: CreateDealDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0">
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
                        <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                        <Input
                            id="expectedCloseDate"
                            name="expectedCloseDate"
                            type="date"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Deal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
