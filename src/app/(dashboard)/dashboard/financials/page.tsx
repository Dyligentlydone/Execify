import { FinancialsClient } from "@/components/finance/financials-client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FinancialsPage() {
    const user = await getCurrentUser();
    let isReadOnly = false;
    if (user?.organizationId) {
        const org = await db.organization.findUnique({
            where: { id: user.organizationId },
            select: { plan: true },
        });
        isReadOnly = org?.plan === "FREE";
    }

    if (isReadOnly) {
        redirect("/dashboard");
    }

    return <FinancialsClient />;
}
