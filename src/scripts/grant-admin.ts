
import dotenv from "dotenv";
dotenv.config();

import { db } from "../lib/db";

async function main() {
    const orgIds = ["cmlsx9hkg0009vnn9wkekrx73"];

    console.log(`Granting EXECUTIVE access to ${orgIds.length} organizations...`);

    for (const id of orgIds) {
        const updated = await db.organization.update({
            where: { id },
            data: {
                plan: "EXECUTIVE",
                stripeSubscriptionId: `sub_admin_bypass_donebydyligent_${id}`
            }
        });
        console.log(`Updated Org: ${updated.name} (${updated.id})`);
        console.log(`  Plan: ${updated.plan}`);
        console.log(`  Sub ID: ${updated.stripeSubscriptionId}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
