"use client";

import { useState } from "react";
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
import { updateDealStage } from "@/server/actions/deals";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Handshake } from "lucide-react";
import { ActivityTimeline } from "@/components/shared/activity-timeline";

type DealWithContact = Deal & { contact?: Contact | null };

interface DealBoardProps {
    initialStages: DealStage[];
    initialDeals: DealWithContact[];
}

export function DealBoard({ initialStages, initialDeals }: DealBoardProps) {
    const [stages] = useState(initialStages);
    const [deals, setDeals] = useState(initialDeals);
    const [activeDeal, setActiveDeal] = useState<DealWithContact | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<DealWithContact | null>(null);

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
                <SheetContent className="sm:max-w-xl w-[400px] sm:w-[540px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="bg-violet-500/10 p-2 rounded-full">
                                <Handshake className="h-5 w-5 text-violet-500" />
                            </div>
                            {selectedDeal?.title}
                        </SheetTitle>
                        <SheetDescription>
                            Value: ${selectedDeal?.value?.toLocaleString() ?? "0"} • Probability: {selectedDeal?.probability}%
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Expected Close</label>
                                <div className="text-sm">{selectedDeal?.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString() : "-"}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Contact</label>
                                <div className="text-sm">{selectedDeal?.contact ? `${selectedDeal.contact.firstName} ${selectedDeal.contact.lastName}` : "-"}</div>
                            </div>
                        </div>

                        <div className="border-t pt-6 h-[400px]">
                            {selectedDeal && (
                                <ActivityTimeline entityType="DEAL" entityId={selectedDeal.id} />
                            )}
                        </div>
                    </div>
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
            <div className="p-2 text-xs text-muted-foreground bg-muted/20 border-b text-center">
                Total: ${totalValue.toLocaleString()}
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
