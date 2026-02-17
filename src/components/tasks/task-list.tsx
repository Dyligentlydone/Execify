"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, Trash, CheckSquare } from "lucide-react";
import { Task } from "@/generated/prisma/client";
import { updateTaskStatus, deleteTask } from "@/server/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { cn } from "@/lib/utils";

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    async function toggleStatus(task: Task, e: React.MouseEvent) {
        e.stopPropagation();
        const newStatus = task.status === "DONE" ? "TODO" : "DONE";

        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );

        const result = await updateTaskStatus(task.id, newStatus);
        if (result?.error) {
            toast.error("Failed to update status");
            // Revert
            setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
            );
        }
    }

    async function handleDelete(taskId: string, e: React.MouseEvent) {
        e.stopPropagation();
        // Optimistic delete
        const oldTasks = tasks;
        setTasks(prev => prev.filter(t => t.id !== taskId));

        const result = await deleteTask(taskId);
        if (result?.error) {
            toast.error("Failed to delete task");
            setTasks(oldTasks);
        } else {
            toast.success("Task deleted");
        }
    }

    return (
        <>
            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No tasks found. Create one to get started.
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="flex items-start gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer"
                        >
                            <button
                                onClick={(e) => toggleStatus(task, e)}
                                className={cn(
                                    "mt-1 rounded-full text-muted-foreground hover:text-primary transition-colors",
                                    task.status === "DONE" && "text-green-500 hover:text-green-600"
                                )}
                            >
                                {task.status === "DONE" ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <Circle className="h-5 w-5" />
                                )}
                            </button>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "font-medium leading-none",
                                            task.status === "DONE" && "line-through text-muted-foreground"
                                        )}
                                    >
                                        {task.title}
                                    </span>
                                    <Badge
                                        variant={
                                            task.priority === "URGENT"
                                                ? "destructive"
                                                : task.priority === "HIGH"
                                                    ? "default"
                                                    : "secondary"
                                        }
                                        className="text-[10px] h-5 px-1.5"
                                    >
                                        {task.priority}
                                    </Badge>
                                </div>
                                {task.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {task.description}
                                    </p>
                                )}
                                {task.dueDate && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-2">
                                        <Clock className="mr-1 h-3 w-3" />
                                        Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                                    </div>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <Trash className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500"
                                        onClick={(e) => handleDelete(task.id, e)}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
            </div>

            <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <SheetContent className="sm:max-w-xl w-[400px] sm:w-[540px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="bg-amber-500/10 p-2 rounded-full">
                                <CheckSquare className="h-5 w-5 text-amber-500" />
                            </div>
                            {selectedTask?.title}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedTask?.description || "No description provided."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                                <div className="text-sm">{selectedTask?.dueDate ? format(new Date(selectedTask.dueDate), "MMM d, yyyy") : "-"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                <div>
                                    <Badge>{selectedTask?.priority}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 h-[400px]">
                            {selectedTask && (
                                <ActivityTimeline entityType="TASK" entityId={selectedTask.id} />
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
