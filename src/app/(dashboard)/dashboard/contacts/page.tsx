import { Suspense } from "react";

export const dynamic = "force-dynamic";

import { getContacts } from "@/server/actions/contacts";
import { CreateContactDialog } from "@/components/crm/create-contact-dialog";
import { ContactList } from "@/components/crm/contact-list";
import { Loader2 } from "lucide-react";

export default async function ContactsPage() {
    const { data: contacts } = await getContacts();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your contacts and customer relationships.
                    </p>
                </div>
                <CreateContactDialog />
            </div>

            <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                <ContactList data={contacts} />
            </Suspense>
        </div>
    );
}
