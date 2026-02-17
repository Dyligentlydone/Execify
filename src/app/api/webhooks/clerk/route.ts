import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_DEAL_STAGES = [
    { name: "Lead", order: 1, color: "#6366f1" },
    { name: "Qualified", order: 2, color: "#8b5cf6" },
    { name: "Proposal", order: 3, color: "#a855f7" },
    { name: "Negotiation", order: 4, color: "#f59e0b" },
    { name: "Closed Won", order: 5, color: "#22c55e" },
    { name: "Closed Lost", order: 6, color: "#ef4444" },
];

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("[Clerk Webhook] Verification failed:", err);
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const eventType = evt.type;

    try {
        switch (eventType) {
            case "user.created": {
                const { id, email_addresses, first_name, last_name, image_url } = evt.data;
                const primaryEmail = email_addresses[0]?.email_address;

                if (primaryEmail) {
                    await db.user.create({
                        data: {
                            clerkUserId: id,
                            email: primaryEmail,
                            firstName: first_name,
                            lastName: last_name,
                            avatarUrl: image_url,
                        },
                    });

                    // Send welcome email
                    await sendWelcomeEmail(primaryEmail, first_name || "there").catch(
                        (err) => console.error("[Clerk Webhook] Welcome email failed:", err)
                    );
                }
                break;
            }

            case "user.updated": {
                const { id, email_addresses, first_name, last_name, image_url } = evt.data;
                const primaryEmail = email_addresses[0]?.email_address;

                await db.user.update({
                    where: { clerkUserId: id },
                    data: {
                        email: primaryEmail,
                        firstName: first_name,
                        lastName: last_name,
                        avatarUrl: image_url,
                    },
                });
                break;
            }

            case "user.deleted": {
                const { id } = evt.data;
                if (id) {
                    await db.user.delete({
                        where: { clerkUserId: id },
                    }).catch(() => {
                        // User might not exist locally
                    });
                }
                break;
            }

            case "organization.created": {
                const { id, name, slug } = evt.data;

                const org = await db.organization.create({
                    data: {
                        clerkOrgId: id,
                        name,
                        slug: slug || id,
                    },
                });

                // Create default deal stages
                await db.dealStage.createMany({
                    data: DEFAULT_DEAL_STAGES.map((stage) => ({
                        ...stage,
                        organizationId: org.id,
                    })),
                });
                break;
            }

            case "organization.updated": {
                const { id, name, slug } = evt.data;
                await db.organization.update({
                    where: { clerkOrgId: id },
                    data: { name, slug: slug || undefined },
                });
                break;
            }

            case "organizationMembership.created": {
                const { organization, public_user_data, role } = evt.data;

                const user = await db.user.findUnique({
                    where: { clerkUserId: public_user_data.user_id },
                });

                const org = await db.organization.findUnique({
                    where: { clerkOrgId: organization.id },
                });

                if (user && org) {
                    const mappedRole = mapClerkRole(role);
                    await db.membership.upsert({
                        where: {
                            userId_organizationId: {
                                userId: user.id,
                                organizationId: org.id,
                            },
                        },
                        create: {
                            userId: user.id,
                            organizationId: org.id,
                            role: mappedRole,
                        },
                        update: {
                            role: mappedRole,
                        },
                    });
                }
                break;
            }

            case "organizationMembership.updated": {
                const { organization, public_user_data, role } = evt.data;

                const user = await db.user.findUnique({
                    where: { clerkUserId: public_user_data.user_id },
                });

                const org = await db.organization.findUnique({
                    where: { clerkOrgId: organization.id },
                });

                if (user && org) {
                    await db.membership.update({
                        where: {
                            userId_organizationId: {
                                userId: user.id,
                                organizationId: org.id,
                            },
                        },
                        data: {
                            role: mapClerkRole(role),
                        },
                    });
                }
                break;
            }

            case "organizationMembership.deleted": {
                const { organization, public_user_data } = evt.data;

                const user = await db.user.findUnique({
                    where: { clerkUserId: public_user_data.user_id },
                });

                const org = await db.organization.findUnique({
                    where: { clerkOrgId: organization.id },
                });

                if (user && org) {
                    await db.membership.delete({
                        where: {
                            userId_organizationId: {
                                userId: user.id,
                                organizationId: org.id,
                            },
                        },
                    }).catch(() => {
                        // Membership might not exist
                    });
                }
                break;
            }

            default:
                console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
        }
    } catch (error) {
        console.error(`[Clerk Webhook] Error processing ${eventType}:`, error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }

    return NextResponse.json({ received: true });
}

function mapClerkRole(clerkRole: string): "OWNER" | "ADMIN" | "MANAGER" | "VIEWER" {
    switch (clerkRole) {
        case "org:admin":
            return "ADMIN";
        case "org:member":
            return "MANAGER";
        default:
            return "VIEWER";
    }
}
