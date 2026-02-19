"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    PointerSensor,
    DragEndEvent,
    DragStartEvent,
    closestCorners,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Deal, DealStage, Contact } from "@/generated/prisma/client";
import { updateDealStage, updateDeal, deleteDeal } from "@/server/actions/deals";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Handshake, Trash, Loader2, Save } from "lucide-react";
import { ActivityTimeline } from "@/components/shared/activity-timeline";

type DealWithContact = Omit<Deal, "value"> & {
    value: number | null;
    contact?: Contact | null;
};

interface DealBoardProps {
    initialStages: DealStage[];
    initialDeals: DealWithContact[];
    contacts: Contact[];
}

export function DealBoard({ initialStages, initialDeals, contacts }: DealBoardProps) {
    const [stages] = useState(initialStages);
    const [deals, setDeals] = useState(initialDeals);
    const [activeDeal, setActiveDeal] = useState<DealWithContact | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const deal = deals.find((d) => d.id === active.id);
        if (deal) setActiveDeal(deal);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Check if dropped on a stage (column)
        const isStage = stages.find((s) => s.id === overId);

        // Check if dropped on another deal card in a column
        const overDeal = deals.find((d) => d.id === overId);

        let newStageId: string | null = null;

        if (isStage) {
            newStageId = isStage.id;
        } else if (overDeal) {
            newStageId = overDeal.stageId;
        }

        if (newStageId && activeId) {
            const currentDeal = deals.find((d) => d.id === activeId);
            if (currentDeal && currentDeal.stageId !== newStageId) {
                // Optimistic update
                const oldStageId = currentDeal.stageId;
                setDeals((prev) =>
                    prev.map((d) => (d.id === activeId ? { ...d, stageId: newStageId! } : d))
                );

                const result = await updateDealStage(activeId, newStageId);
                if (result?.error) {
                    toast.error("Failed to update deal stage");
                    // Revert
                    setDeals((prev) =>
                        prev.map((d) => (d.id === activeId ? { ...d, stageId: oldStageId } : d))
                    );
                }
            }
        }
    }

    if (!isMounted) return null;

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-[calc(100vh-12rem)] gap-4 overflow-x-auto pb-4">
                    {stages.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            deals={deals.filter((d) => d.stageId === stage.id)}
                            onDealClick={setSelectedDeal}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeDeal ? (
                        <DealCard deal={activeDeal} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Sheet open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
                <SheetContent className="sm:max-w-xl w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="bg-amber-500/10 p-2 rounded-full">
                                <Handshake className="h-5 w-5 text-amber-500" />
                            </div>
                            Edit Deal
                        </SheetTitle>
                        <SheetDescription>
                            Update deal details or manage related activities.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedDeal && (
                        <div className="space-y-8 pb-10">
                            <EditDealForm
                                deal={selectedDeal}
                                contacts={contacts}
                                stages={stages}
                                onUpdate={(updates) => {
                                    setDeals(prev => prev.map(d =>
                                        d.id === selectedDeal.id ? { ...d, ...updates } : d
                                    ));
                                    setSelectedDeal(prev => prev ? { ...prev, ...updates } : null);
                                    // We don't close the sheet, allowing continued editing/notes
                                    // toast.success("Refreshed");
                                }}
                                onDelete={(id) => {
                                    setDeals(prev => prev.filter(d => d.id !== id));
                                    setSelectedDeal(null);
                                }}
                            />

                            <div className="border-t pt-6">
                                <h3 className="text-sm font-semibold mb-4">Activity & Notes</h3>
                                <ActivityTimeline entityType="DEAL" entityId={selectedDeal.id} />
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

function KanbanColumn({
    stage,
    deals,
    onDealClick,
}: {
    stage: DealStage;
    deals: DealWithContact[];
    onDealClick: (deal: DealWithContact) => void;
}) {
    const { setNodeRef } = useSortable({
        id: stage.id,
        data: { type: "Column", stage },
        disabled: true,
    });

    const totalValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);

    return (
        <div
            ref={setNodeRef}
            className="flex h-full w-[350px] min-w-[350px] flex-col rounded-lg bg-muted/30 border border-border/50"
        >
            <div className="flex items-center justify-between p-4 bg-muted/50 border-b border-border/50 rounded-t-lg">
                <h3 className="font-semibold text-sm">{stage.name}</h3>
                <Badge variant="secondary" className="text-xs">
                    {deals.length}
                </Badge>
            </div>
            <div className="p-2 text-xs text-muted-foreground bg-muted/20 border-b text-center font-medium">
                Total: <span className="text-amber-500 font-bold">${totalValue.toLocaleString()}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SortableContext
                    items={deals.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {deals.map(deal => (
                        <DraggableDealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
                    ))}
                </SortableContext>
                {deals.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableDealCard({ deal, onClick }: { deal: DealWithContact; onClick?: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: deal.id,
        data: { type: "Deal", deal },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
            <DealCard deal={deal} />
        </div>
    )
}

function DealCard({ deal, isOverlay }: { deal: DealWithContact; isOverlay?: boolean }) {
    return (
        <Card className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${isOverlay ? "shadow-xl border-primary/50" : "border-border/50 bg-background"}`}>
            <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium leading-none">{deal.title}</span>
                    {deal.probability !== null && (
                        <Badge variant="outline" className="text-xs scale-90 origin-right">
                            {deal.probability}%
                        </Badge>
                    )}
                </div>
                <div className="text-lg font-bold">
                    ${deal.value?.toLocaleString() ?? "0"}
                </div>
                {deal.contact && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <span>{deal.contact.firstName} {deal.contact.lastName}</span>
                    </div>
                )}
                {deal.expectedCloseDate && (
                    <div className="text-xs text-muted-foreground mt-1">
                        Due {new Date(deal.expectedCloseDate).toLocaleDateString()}
                    </div>
                )}

            </CardContent>
        </Card>
    );
}

function EditDealForm({
    deal,
    contacts,
    stages,
    onUpdate,
    onDelete
}: {
    deal: DealWithContact;
    contacts: Contact[];
    stages: DealStage[];
    onUpdate: (data: Partial<DealWithContact> & { stageId?: string }) => void;
    onDelete: (id: string) => void;
}) {
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = await updateDeal(deal.id, formData);

        // ... (rest of submit logic)
        // [Check: Need to handle stageId update specifically in onUpdate if it changes column]

        if (result?.error) {
            toast.error("Failed to update deal");
        } else {
            toast.success("Deal updated");
            const updates: any = Object.fromEntries(formData.entries());
            if (updates.value) updates.value = Number(updates.value);
            if (updates.probability) updates.probability = Number(updates.probability);

            // Check if stage changed
            if (updates.stageId && updates.stageId !== deal.stageId) {
                // The parent onUpdate handles merging, but for stage changes 
                // the board state needs to move the deal to the new column.
                // onUpdate in DealBoard just updates the deal object in the array.
                // Since DealBoard filters deals by stageId for columns, this should just work!
            }

            onUpdate(updates as Partial<DealWithContact>);
        }
        setLoading(false);
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this deal?")) return;
        setLoading(true);
        const result = await deleteDeal(deal.id);

        if (result?.error) {
            toast.error("Failed to delete deal");
            setLoading(false);
        } else {
            toast.success("Deal deleted");
            onDelete(deal.id);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="edit-title">Deal Title</Label>
                    <Input id="edit-title" name="title" defaultValue={deal.title} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-value">Value ($)</Label>
                        <Input
                            id="edit-value"
                            name="value"
                            type="number"
                            defaultValue={deal.value ? Number(deal.value) : ""}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-stage">Stage</Label>
                        <Select name="stageId" defaultValue={deal.stageId}>
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-probability">Probability (%)</Label>
                        <Input
                            id="edit-probability"
                            name="probability"
                            type="number"
                            defaultValue={deal.probability ?? ""}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-date">Expected Close</Label>
                        <Input
                            id="edit-date"
                            name="expectedCloseDate"
                            type="date"
                            defaultValue={deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : ""}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="edit-contact">Contact</Label>
                    <Select name="contactId" defaultValue={deal.contactId || " "}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">None</SelectItem>
                            {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                    {contact.firstName} {contact.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div >

            <div className="flex items-center justify-between pt-4 border-t">
                <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4 mr-2" />}
                    Delete Deal
                </Button>
                <Button
                    type="submit"
                    className="gold-surface text-black font-semibold"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>
        </form >
    );
}
