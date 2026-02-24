import { Suspense } from "react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { getInvoices } from "@/server/actions/invoices";
import { getContacts } from "@/server/actions/contacts";
import { getRecurringInvoices, processRecurringBilling } from "@/server/actions/recurring-invoices";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { RecurringInvoiceList } from "@/components/finance/recurring-invoice-list";
import { Loader2, Receipt, Repeat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function InvoicesPage() {
    // Process any due recurring invoices on load (Simulated Cron)
    await processRecurringBilling();

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

    const [invoicesRaw, contacts, recurringRaw] = await Promise.all([
        getInvoices(),
        getContacts(),
        getRecurringInvoices(),
    ]);

    // Serialize to strip Prisma Decimal/Date objects that can't be passed to client components
    const invoices = JSON.parse(JSON.stringify(invoicesRaw));
    const recurring = JSON.parse(JSON.stringify(recurringRaw));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Finance Hub
                    </h2>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Automate your billing and track your revenue growth.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <CreateInvoiceDialog contacts={contacts.data} isReadOnly={isReadOnly} />
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="all" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Receipt className="h-4 w-4" />
                        All Invoices
                    </TabsTrigger>
                    <TabsTrigger value="recurring" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Repeat className="h-4 w-4" />
                        Recurring Billing
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 border-none p-0 outline-none">
                    <Suspense fallback={
                        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                        </div>
                    }>
                        <InvoiceList data={invoices as any} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="recurring" className="space-y-4 border-none p-0 outline-none">
                    <Suspense fallback={
                        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                        </div>
                    }>
                        <RecurringInvoiceList data={recurring as any} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
