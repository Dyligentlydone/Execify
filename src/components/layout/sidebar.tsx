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
    Bot,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Contacts",
        href: "/dashboard/contacts",
        icon: Users,
    },
    {
        label: "Deals",
        href: "/dashboard/deals",
        icon: Handshake,
    },
    {
        label: "Tasks",
        href: "/dashboard/tasks",
        icon: CheckSquare,
    },
    {
        label: "Invoices",
        href: "/dashboard/invoices",
        icon: FileText,
    },
    {
        label: "AI Assistant",
        href: "/dashboard/ai",
        icon: Bot,
    },
];

const BOTTOM_NAV = [
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
                collapsed ? "w-[68px]" : "w-[260px]"
            )}
        >
            {/* Logo / Brand */}
            <div className="flex h-16 items-center gap-2 px-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shrink-0">
                    E
                </div>
                {!collapsed && (
                    <span className="text-lg font-bold tracking-tight text-foreground">
                        Execify
                    </span>
                )}
            </div>

            <Separator />

            {/* Org Switcher */}
            <div className={cn("px-3 py-3", collapsed && "px-2")}>
                <OrganizationSwitcher
                    hidePersonal
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            organizationSwitcherTrigger: cn(
                                "w-full justify-start rounded-lg border border-border bg-background px-3 py-2 text-sm",
                                collapsed && "px-2 justify-center"
                            ),
                        },
                    }}
                />
            </div>

            <Separator />

            {/* Main Nav */}
            <nav className="flex-1 space-y-1 px-3 py-3">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                                    : "text-sidebar-foreground/70",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return linkContent;
                })}
            </nav>

            {/* Bottom Nav */}
            <div className="space-y-1 px-3 pb-3">
                <Separator className="mb-3" />

                {BOTTOM_NAV.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-primary"
                                    : "text-sidebar-foreground/70",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return linkContent;
                })}

                {/* User Button */}
                <div
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2",
                        collapsed && "justify-center px-2"
                    )}
                >
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "h-8 w-8",
                            },
                        }}
                    />
                </div>

                {/* Collapse Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "w-full justify-center text-muted-foreground hover:text-foreground",
                        collapsed && "px-2"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            <span>Collapse</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
