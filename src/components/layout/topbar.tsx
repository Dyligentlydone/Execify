"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "./mobile-nav";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/contacts": "Contacts",
    "/dashboard/deals": "Deals",
    "/dashboard/tasks": "Tasks",
    "/dashboard/invoices": "Invoices",
    "/dashboard/ai": "AI Assistant",
    "/dashboard/settings": "Settings",
};

export function Topbar({ isReadOnly }: { isReadOnly?: boolean }) {
    const pathname = usePathname();

    // Find the best matching page title
    const title = Object.entries(PAGE_TITLES)
        .sort((a, b) => b[0].length - a[0].length)
        .find(([path]) => pathname.startsWith(path))?.[1] || "Dashboard";

    return (
        <div className="flex flex-col w-full">
            {isReadOnly && (
                <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-sm flex items-center justify-center gap-2 text-destructive font-medium">
                    <AlertCircle className="h-4 w-4" />
                    <span>Your subscription is past due. Your workspace is in Read-Only mode.</span>
                    <Link href="/dashboard/settings/billing" className="underline underline-offset-2 ml-2 hover:text-destructive/80">
                        Upgrade Now
                    </Link>
                </div>
            )}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-lg md:px-6">
                {/* Mobile nav trigger */}
                <MobileNav isReadOnly={isReadOnly} />

                {/* Page title */}
                <h1 className="text-lg font-semibold tracking-tight md:text-xl">
                    {title}
                </h1>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Search (placeholder) */}
                <div className="hidden items-center md:flex">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="w-[240px] pl-9 bg-muted/50 border-none focus-visible:ring-1"
                        />
                    </div>
                </div>

                {/* Notifications (placeholder) */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="sr-only">Notifications</span>
                </Button>
            </header>
        </div >
    );
}
