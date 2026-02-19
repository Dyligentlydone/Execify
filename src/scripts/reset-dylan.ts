
import dotenv from "dotenv";
dotenv.config();

import { db } from "../lib/db";

async function main() {
    const email = "dylan@dyligent.solutions";
    console.log(`Searching for user: ${email}...`);

    const user = await db.user.findUnique({
        where: { email },
        include: {
            memberships: {
                include: {
                    organization: true
                }
            }
        }
    });

    if (!user) {
        console.log("User not found. Nothing to delete.");
        return;
    }

    console.log(`Found user: ${user.id}`);
    console.log(`Deleting user and associated data...`);

    // Delete the user using a transaction to ensure clean state
    // Prisma *should* cascade delete memberships if set up in schema,
    // but we can just delete the user and let the DB handle constraints 
    // or manually clean up if needed.
    // For a "hard reset", deleting the user is usually enough if relations are optional or cascading.

    // However, to be thorough and remove the "Dyligent" org so they can recreate it:
    const orgIdsToDelete = user.memberships
        .filter(m => m.role === "OWNER")
        .map(m => m.organizationId);

    if (orgIdsToDelete.length > 0) {
        console.log(`Deleting data for ${orgIdsToDelete.length} organizations...`);

        // Delete all related data first to avoid FK constraints
        await db.contact.deleteMany({ where: { organizationId: { in: orgIdsToDelete } } });
        await db.deal.deleteMany({ where: { organizationId: { in: orgIdsToDelete } } });
        await db.task.deleteMany({ where: { organizationId: { in: orgIdsToDelete } } });
        await db.invoice.deleteMany({ where: { organizationId: { in: orgIdsToDelete } } });
        // Add other models if necessary (ActivityLog, Note, etc.)

        await db.organization.deleteMany({
            where: {
                id: { in: orgIdsToDelete }
            }
        });
    }

    // Also delete any contacts, deals, tasks, and invoices created by this user
    await db.contact.deleteMany({ where: { createdById: user.id } });
    await db.deal.deleteMany({ where: { createdById: user.id } });
    await db.task.deleteMany({ where: { createdById: user.id } });
    await db.invoice.deleteMany({ where: { createdById: user.id } });
    await db.recurringInvoice.deleteMany({ where: { createdById: user.id } });
    await db.activityLog.deleteMany({ where: { userId: user.id } });
    await db.note.deleteMany({ where: { createdById: user.id } });
    await db.expense.deleteMany({ where: { createdById: user.id } });

    // Finally delete the user
    await db.user.delete({
        where: { id: user.id }
    });

    console.log("✅ User and all associated data deleted successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
