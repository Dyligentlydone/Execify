"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock User Data
const DEMO_USER = {
    id: "user_demo",
    fullName: "Demo User",
    firstName: "Demo",
    lastName: "User",
    primaryEmailAddress: { emailAddress: "demo@execuaide.app" },
    imageUrl: "",
};

const DEMO_ORG = {
    id: "org_demo",
    name: "Acme Corp (Demo)",
    slug: "acme-demo",
    imageUrl: "",
};

// --- Context ---
const AuthContext = createContext({
    isLoaded: true,
    isSignedIn: true,
    user: DEMO_USER,
    orgId: DEMO_ORG.id,
    orgRole: "org:admin",
});

export const useUser = () => {
    return {
        isLoaded: true,
        isSignedIn: true,
        user: DEMO_USER,
    };
};

export const useAuth = () => {
    return {
        isLoaded: true,
        userId: DEMO_USER.id,
        sessionId: "sess_demo",
        orgId: DEMO_ORG.id,
        orgRole: "org:admin",
        orgSlug: DEMO_ORG.slug,
        signOut: async () => { },
    }
}

export const useOrganization = () => {
    return {
        isLoaded: true,
        organization: DEMO_ORG,
        membership: { role: "org:admin" }
    }
}

export const useOrganizationList = () => {
    return {
        isLoaded: true,
        userMemberships: [
            {
                organization: DEMO_ORG,
                membership: { role: "org:admin" }
            }
        ],
        setActive: () => { }
    }
}


// --- Components ---

export function ClerkProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthContext.Provider value={{
            isLoaded: true,
            isSignedIn: true,
            user: DEMO_USER,
            orgId: DEMO_ORG.id,
            orgRole: "org:admin"
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function SignedIn({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
    return null;
}

export function RedirectToSignIn() {
    return null;
}

export function UserButton({ afterSignOutUrl, ...props }: { afterSignOutUrl?: string } & any) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" {...props}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={DEMO_USER.imageUrl} alt={DEMO_USER.fullName} />
                        <AvatarFallback>DU</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{DEMO_USER.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {DEMO_USER.primaryEmailAddress.emailAddress}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    Demo Mode (Sign Out Disabled)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function OrganizationSwitcher({ hidePersonal, ...props }: { hidePersonal?: boolean } & any) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-label="Select organization"
                    className="w-[200px] justify-between"
                    {...props}
                >
                    <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage src={DEMO_ORG.imageUrl} alt={DEMO_ORG.name} />
                        <AvatarFallback>AC</AvatarFallback>
                    </Avatar>
                    {DEMO_ORG.name}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuItem>
                    <Avatar className="mr-2 h-5 w-5">
                        <AvatarFallback>AC</AvatarFallback>
                    </Avatar>
                    {DEMO_ORG.name}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    <Plus className="mr-2 h-4 w-4" /> Create Organization
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
