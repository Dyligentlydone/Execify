import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="mx-auto w-full max-w-md space-y-6 px-4">
                <div className="text-center space-y-2 mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white">
                            E
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Execify</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Sign in to your business command center
                    </p>
                </div>
                <SignIn
                    appearance={{
                        elements: {
                            card: "bg-card border border-border shadow-xl",
                            headerTitle: "text-foreground",
                            headerSubtitle: "text-muted-foreground",
                            formButtonPrimary:
                                "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
                        },
                    }}
                />
            </div>
        </div>
    );
}
