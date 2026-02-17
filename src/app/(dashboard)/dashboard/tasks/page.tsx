import { Suspense } from "react";
import { getTasks } from "@/server/actions/tasks";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { Loader2 } from "lucide-react";

export default async function TasksPage() {
    const tasks = await getTasks();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your daily tasks and priorities.
                    </p>
                </div>
                <CreateTaskDialog />
            </div>

            <div className="max-w-4xl">
                <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                    <TaskList initialTasks={tasks} />
                </Suspense>
            </div>
        </div>
    );
}
