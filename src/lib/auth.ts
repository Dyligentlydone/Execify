import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Role } from "@/generated/prisma/client";

export type AuthUser = {
    id: string;
    clerkUserId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    organizationId: string | null;
    role: Role | null;
};

const DEFAULT_DEAL_STAGES = [
    { name: "Lead", order: 1, color: "#6366f1" },
    { name: "Qualified", order: 2, color: "#8b5cf6" },
    { name: "Proposal", order: 3, color: "#a855f7" },
    { name: "Negotiation", order: 4, color: "#f59e0b" },
    { name: "Closed Won", order: 5, color: "#22c55e" },
    { name: "Closed Lost", order: 6, color: "#ef4444" },
];

/**
 * Get the current authenticated user with their local DB record
 * and active organization context.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const { userId, orgId, orgRole } = await auth();

    if (!userId) return null;

    // 1. Ensure user exists in local DB
    let user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) {
        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
        if (!primaryEmail) return null;

        user = await db.user.upsert({
            where: { email: primaryEmail },
            update: {
                clerkUserId: userId,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                avatarUrl: clerkUser.imageUrl,
            },
            create: {
                clerkUserId: userId,
                email: primaryEmail,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                avatarUrl: clerkUser.imageUrl,
            },
        });
    }

    let organizationId: string | null = null;
    let role: Role | null = null;

    // 2. If an organization is selected, ensure it and membership exist in local DB
    if (orgId) {
        let org = await db.organization.findUnique({
            where: { clerkOrgId: orgId },
        });

        if (!org) {
            const client = await clerkClient();
            const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });

            org = await db.organization.create({
                data: {
                    clerkOrgId: orgId,
                    name: clerkOrg.name,
                    slug: clerkOrg.slug || orgId,
                },
            });

            // Create default deal stages
            await db.dealStage.createMany({
                data: DEFAULT_DEAL_STAGES.map((stage) => ({
                    ...stage,
                    organizationId: org!.id,
                })),
            });
        }

        organizationId = org.id;

        // 3. Ensure membership exists
        const membership = await db.membership.upsert({
            where: {
                userId_organizationId: {
                    userId: user.id,
                    organizationId: org.id,
                },
            },
            create: {
                userId: user.id,
                organizationId: org.id,
                role: mapClerkRole(orgRole || ""),
            },
            update: {
                role: mapClerkRole(orgRole || ""),
            },
        });

        role = membership.role;
    }

    return {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        organizationId,
        role,
    };
}

function mapClerkRole(clerkRole: string): Role {
    if (clerkRole === "org:admin") return "ADMIN";
    if (clerkRole === "org:member") return "MANAGER";
    return "VIEWER";
}

/**
 * Require a minimum role level. Throws if the user doesn't meet the requirement.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    VIEWER: 1,
};

export async function requireRole(minRole: Role): Promise<AuthUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized: Not authenticated");
    }

    if (!user.organizationId) {
        throw new Error("Unauthorized: No organization selected");
    }

    if (!user.role) {
        throw new Error("Unauthorized: No role assigned");
    }

    if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
        throw new Error(
            `Unauthorized: Requires ${minRole} role, but user has ${user.role}`
        );
    }

    return user;
}

/**
 * Get the current tenant (organization) ID. Throws if not in an org context.
 */
export async function getTenantId(): Promise<string> {
    const user = await getCurrentUser();

    if (!user?.organizationId) {
        throw new Error("No organization context");
    }

    return user.organizationId;
}

/**
 * Require an active (paid) subscription.
 * Throws if the organization is on the FREE plan.
 */
export async function requireActiveSubscription(): Promise<void> {
    const user = await getCurrentUser();

    if (!user?.organizationId) {
        throw new Error("Unauthorized: No organization selected");
    }

    const org = await db.organization.findUnique({
        where: { id: user.organizationId },
        select: { plan: true },
    });

    if (org?.plan === "FREE") {
        throw new Error("Payment Required: Subscription is in read-only mode.");
    }
}
