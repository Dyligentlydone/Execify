"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "./mobile-nav";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/contacts": "Contacts",
    "/dashboard/deals": "Deals",
    "/dashboard/tasks": "Tasks",
    "/dashboard/invoices": "Invoices",
    "/dashboard/ai": "AI Assistant",
    "/dashboard/settings": "Settings",
};

export function Topbar() {
    const pathname = usePathname();

    // Find the best matching page title
    const title = Object.entries(PAGE_TITLES)
        .sort((a, b) => b[0].length - a[0].length)
        .find(([path]) => pathname.startsWith(path))?.[1] || "Dashboard";

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-lg md:px-6">
            {/* Mobile nav trigger */}
            <MobileNav />

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
    );
}
