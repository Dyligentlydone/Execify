import { CreateOrganization } from "@clerk/nextjs";

export default function OnboardingPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Welcome to Execufy
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        To get started, we need to set up your business workspace.
                        This is where your team, contacts, and financial data will live.
                    </p>
                </div>

                <div className="flex justify-center">
                    <CreateOrganization
                        routing="hash"
                        afterCreateOrganizationUrl="/dashboard"
                    />
                </div>

                <div className="text-center text-sm text-muted-foreground italic">
                    <p>Already have an invite? Check your email or use the organization switcher.</p>
                </div>
            </div>
        </div>
    );
}
