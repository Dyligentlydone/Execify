import dotenv from "dotenv";
dotenv.config();

import { db } from "../lib/db";

async function main() {
    const email = "dylanhaner00@gmail.com";
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

    if (!user || user.memberships.length === 0) {
        console.log("User or organization not found.");
        return;
    }

    const orgId = user.memberships[0].organizationId;
    console.log(`Found organization: ${orgId}`);

    await db.organization.update({
        where: { id: orgId },
        data: { plan: "EXECUTIVE" }
    });

    console.log(`✅ Organization successfully upgraded to EXECUTIVE plan.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
