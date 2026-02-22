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
import { Textarea } from "@/components/ui/textarea";
import { createTask } from "@/server/actions/tasks";

export function CreateTaskDialog({ isReadOnly }: { isReadOnly?: boolean }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createTask(formData);

        if (result?.error) {
            if (typeof result.error === "string") {
                toast.error(result.error);
            } else {
                toast.error("Please check the form for errors");
            }
        } else {
            toast.success("Task created successfully");
            setOpen(false);
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gold-action-button" disabled={isReadOnly}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Task</DialogTitle>
                    <DialogDescription>
                        Create a new task and assign priority.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input id="title" name="title" placeholder="Follow up with client" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Details about the task..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select name="priority" defaultValue="MEDIUM">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                            />
                        </div>
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
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
