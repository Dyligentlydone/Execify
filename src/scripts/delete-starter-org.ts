
import dotenv from "dotenv";
dotenv.config();

import { db } from "../lib/db";

async function main() {
    const orgIdToDelete = "cmlsvhtry0001lf01rcu55h5j"; // The STARTER plan org
    const orgIdToKeep = "cmlsvhzhp0008lf0125w81vjw";   // The EXECUTIVE plan org

    console.log(`Deleting accidental organization: ${orgIdToDelete}...`);

    // Verify it exists first
    const org = await db.organization.findUnique({
        where: { id: orgIdToDelete }
    });

    if (!org) {
        console.log("Organization not found. Already deleted?");
        return;
    }

    if (org.plan === "EXECUTIVE" || org.stripeSubscriptionId?.includes("bypass")) {
        console.error("❌ CRITICAL ERROR: Attempted to delete the EXECUTIVE org! Aborting.");
        return;
    }

    // Delete relationships to avoid FK errors (similar to reset-dylan)
    // We only delete data belonging to THIS specific org ID
    console.log("Cleaning up organization data...");
    await db.contact.deleteMany({ where: { organizationId: orgIdToDelete } });
    await db.deal.deleteMany({ where: { organizationId: orgIdToDelete } });
    await db.task.deleteMany({ where: { organizationId: orgIdToDelete } });
    await db.invoice.deleteMany({ where: { organizationId: orgIdToDelete } });
    await db.recurringInvoice.deleteMany({ where: { organizationId: orgIdToDelete } });

    // Also delete memberships for this org
    await db.membership.deleteMany({ where: { organizationId: orgIdToDelete } });

    // Finally delete the org
    await db.organization.delete({
        where: { id: orgIdToDelete }
    });

    console.log("✅ Accidental 'Starter' organization deleted successfully.");
    console.log(`The 'Executive' organization (${orgIdToKeep}) remains safe.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
