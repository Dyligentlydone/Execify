import { Suspense } from "react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { getContacts } from "@/server/actions/contacts";
import { CreateContactDialog } from "@/components/crm/create-contact-dialog";
import { ContactList } from "@/components/crm/contact-list";
import { Loader2 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ContactsPage() {
    const { data: contacts } = await getContacts();
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your contacts and customer relationships.
                    </p>
                </div>
                <CreateContactDialog isReadOnly={isReadOnly} />
            </div>

            <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                <ContactList data={contacts} />
            </Suspense>
        </div>
    );
}
