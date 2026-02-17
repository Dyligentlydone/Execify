
import { PrismaClient } from "@/generated/prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("Seeding demo data...");

    const demoOrgId = "org_demo";
    const demoUserId = "user_demo";

    // Create or update User
    const user = await db.user.upsert({
        where: { clerkUserId: "user_demo_clerk" },
        update: {},
        create: {
            clerkUserId: "user_demo_clerk",
            email: "demo@execify.app",
            firstName: "Demo",
            lastName: "User",
        },
    });

    // Create or update Organization
    const org = await db.organization.upsert({
        where: { clerkOrgId: "org_demo_clerk" },
        update: {},
        create: {
            clerkOrgId: "org_demo_clerk",
            name: "Acme Corp (Demo)",
            slug: "acme-demo",
        },
    });

    // Create Membership
    await db.membership.upsert({
        where: {
            userId_organizationId: {
                userId: user.id,
                organizationId: org.id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            organizationId: org.id,
            role: "OWNER",
        },
    });

    console.log("Demo data seeded!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
