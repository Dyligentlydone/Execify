"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, OrganizationSwitcher, useUser } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Users,
    Handshake,
    CheckSquare,
    FileText,
    DollarSign,
    Bot,
    Settings,
    Menu,
    X,
    Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Contacts", href: "/dashboard/contacts", icon: Users },
    { label: "Deals", href: "/dashboard/deals", icon: Handshake },
    { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
    { label: "Financials", href: "/dashboard/financials", icon: DollarSign },
    { label: "Taxes", href: "/dashboard/taxes", icon: Calculator },
    { label: "AI Assistant", href: "/dashboard/ai", icon: Bot },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav({ isReadOnly }: { isReadOnly?: boolean }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" suppressHydrationWarning>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-16 items-center gap-2 px-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                        E
                    </div>
                    <span className="text-lg font-bold tracking-tight">Execufy</span>
                </div>

                <Separator />

                <div className="px-3 py-3">
                    <OrganizationSwitcher
                        hidePersonal
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                organizationSwitcherTrigger:
                                    "w-full justify-start rounded-lg border border-border bg-background px-3 py-2 text-sm",
                            },
                        }}
                    />
                </div>

                <Separator />

                <nav className="space-y-1 px-3 py-3">
                    {NAV_ITEMS.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        const isDisabled = isReadOnly && item.href !== "/dashboard" && item.href !== "/dashboard/settings";

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={(e) => {
                                    if (isDisabled) {
                                        e.preventDefault();
                                        return;
                                    }
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isActive
                                        ? "bg-accent text-accent-foreground shadow-sm"
                                        : "text-muted-foreground",
                                    isDisabled && "pointer-events-none opacity-50"
                                )}
                                tabIndex={isDisabled ? -1 : undefined}
                                aria-disabled={isDisabled}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <Separator className="mb-4" />
                    <div className="flex items-center gap-3 px-3">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "h-8 w-8",
                                },
                            }}
                        />
                        <span className="text-sm text-muted-foreground">Account</span>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
