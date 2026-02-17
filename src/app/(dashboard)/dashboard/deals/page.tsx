import { Suspense } from "react";

export const dynamic = "force-dynamic";

import { getDeals } from "@/server/actions/deals";
import { CreateDealDialog } from "@/components/crm/create-deal-dialog";
import { DealBoard } from "@/components/crm/deal-board";
import { Loader2 } from "lucide-react";

export default async function DealsPage() {
    const { stages, deals } = await getDeals();

    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Deals</h2>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your sales pipeline.
                    </p>
                </div>
                <CreateDealDialog stages={stages} />
            </div>

            <div className="flex-1 overflow-auto -mx-1 px-1">
                <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                    <DealBoard initialStages={stages} initialDeals={deals} />
                </Suspense>
            </div>
        </div>
    );
}
