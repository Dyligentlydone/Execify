import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    if (!user.organizationId) {
        redirect("/onboarding");
    }

    // Allow FREE users into the dashboard (read-only mode)
    // We removed the strict !stripeSubscriptionId lockout here.

    let isReadOnly = false;
    if (user.organizationId) {
        const org = await db.organization.findUnique({
            where: { id: user.organizationId },
            select: { plan: true },
        });
        isReadOnly = org?.plan === "FREE";
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop sidebar */}
            <div className="hidden md:flex">
                <Sidebar isReadOnly={isReadOnly} />
            </div>

            {/* Main content area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar isReadOnly={isReadOnly} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
