"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createStripeCheckoutSession } from "@/server/actions/stripe";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UpgradeButtonProps {
    priceId: string;
    current?: boolean;
}

export function UpgradeButton({ priceId, current }: UpgradeButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const url = await createStripeCheckoutSession(priceId);
            window.location.href = url;
        } catch (error) {
            console.error("Upgrade error:", error);
            toast.error("Failed to start checkout session");
            setIsLoading(false);
        }
    };

    if (current) {
        return (
            <Button disabled className="w-full" variant="outline">
                Current Plan
            </Button>
        );
    }

    return (
        <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full gold-surface border-0 text-black hover:bg-[#cb9b51] hover:text-white transition-colors"
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upgrade
        </Button>
    );
}
