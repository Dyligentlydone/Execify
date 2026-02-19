
import dotenv from "dotenv";
dotenv.config();

import { db } from "../lib/db";

async function main() {
    const searchTerm = process.argv[2] || "dylan@dyligent.solutions";
    console.log(`Searching for users with email containing: ${searchTerm}`);

    try {
        const users = await db.user.findMany({
            where: {
                email: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            include: {
                memberships: {
                    include: {
                        organization: true
                    }
                }
            },
        });

        console.log(`Found ${users.length} users:`);
        users.forEach((u) => {
            console.log(`- ${u.email} (ID: ${u.id})`);
            if (u.memberships.length > 0) {
                u.memberships.forEach((m) => {
                    console.log(`  Org: ${m.organization?.name} (ID: ${m.organizationId})`);
                    console.log(`  Plan: ${m.organization?.plan}`);
                    console.log(`  Sub ID: ${m.organization?.stripeSubscriptionId}`);
                });
            } else {
                console.log(`  No Organization Membership found.`);
            }
            console.log("---");
        });
    } catch (error) {
        console.error("Error querying users:", error);
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
