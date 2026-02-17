"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Send, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createNote, getNotes } from "@/server/actions/notes";
import { Note, User } from "@/generated/prisma/client";

interface ActivityTimelineProps {
    entityType: "CONTACT" | "DEAL" | "TASK";
    entityId: string;
}

type NoteWithUser = Note & { createdBy: User };

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
    const [notes, setNotes] = useState<NoteWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function loadNotes() {
            try {
                const fetchedNotes = await getNotes(entityType, entityId);
                setNotes(fetchedNotes as NoteWithUser[]);
            } catch (error) {
                console.error("Failed to load notes", error);
            } finally {
                setLoading(false);
            }
        }
        loadNotes();
    }, [entityType, entityId]);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        formData.append("entityType", entityType);
        formData.append("entityId", entityId);

        const result = await createNote(formData);

        if (result?.error) {
            toast.error("Failed to add note");
        } else {
            toast.success("Note added");
            // Reload notes
            const fetchedNotes = await getNotes(entityType, entityId);
            setNotes(fetchedNotes as NoteWithUser[]);
            (e.target as HTMLFormElement).reset();
        }
        setSubmitting(false);
    }

    return (
        <div className="flex flex-col h-full">
            <h3 className="font-semibold mb-4 px-1">Activity & Notes</h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4 min-h-[200px]">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : notes.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg">
                        No activity yet. Add a note to start.
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                {note.createdBy.avatarUrl ? (
                                    <AvatarImage src={note.createdBy.avatarUrl} />
                                ) : (
                                    <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                )}
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{note.createdBy.firstName || "User"}</span>
                                    <span className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, h:mm a")}</span>
                                </div>
                                <p className="text-sm text-foreground/90 bg-muted/30 p-2 rounded-md border border-border/50">
                                    {note.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={onSubmit} className="relative">
                <Textarea
                    name="content"
                    placeholder="Type a note..."
                    className="min-h-[80px] bg-background pr-12"
                    required
                />
                <Button
                    type="submit"
                    size="icon"
                    className="absolute bottom-2 right-2 h-8 w-8"
                    disabled={submitting}
                >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    );
}
