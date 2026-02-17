"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan");

    // Pass the plan to the onboarding page via redirect
    const redirectUrl = plan ? `/onboarding?plan=${plan}` : "/onboarding";

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="mx-auto w-full max-w-md space-y-6 px-4">
                <div className="text-center space-y-2 mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-icon text-lg font-bold text-black">
                            E
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Execify</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {plan ? `Create your account to start your ${plan} plan` : "Create your business command center"}
                    </p>
                </div>
                <SignUp
                    forceRedirectUrl={redirectUrl}
                    appearance={{
                        elements: {
                            card: "bg-card border border-border shadow-xl",
                            headerTitle: "text-foreground",
                            headerSubtitle: "text-muted-foreground",
                            formButtonPrimary:
                                "bg-gradient-to-r from-[#462523] via-[#cb9b51] to-[#f6e27a] hover:from-[#8b6914] hover:via-[#ddb668] hover:to-[#f6f2c0] text-black font-semibold shadow-lg",
                        },
                    }}
                />
            </div>
        </div>
    );
}
