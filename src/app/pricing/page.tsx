import { PLANS } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const PLAN_LIST = [
    { key: "STARTER" as const, price: "$29", period: "month", popular: false },
    { key: "PRO" as const, price: "$79", period: "month", popular: true },
    { key: "EXECUTIVE" as const, price: "$199", period: "month", popular: false },
];

export default function PricingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Simple Header */}
            <header className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg gold-icon text-sm font-bold text-black">
                            E
                        </div>
                        <span className="text-lg font-bold tracking-tight">Execufy</span>
                    </Link>
                    <nav className="flex gap-4">
                        <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">
                            Log in
                        </Link>
                        <Link href="/sign-up" className="text-sm font-medium hover:text-primary transition-colors">
                            Sign up
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 py-20 sm:py-32 relative overflow-hidden">
                {/* Background effects similar to landing page */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-[#cb9b51]/10 via-[#8b6914]/5 to-transparent blur-3xl" />
                </div>

                <div className="container px-4 md:px-6 mx-auto max-w-7xl">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                Simple, transparent{" "}
                                <span className="gold-text-simple">pricing</span>
                            </h1>
                            <p className="max-w-[700px] mx-auto text-lg text-muted-foreground md:text-xl">
                                Choose the plan that scales with your business. No hidden fees.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                        {PLAN_LIST.map((plan) => (
                            <Card
                                key={plan.key}
                                className={`relative overflow-hidden transition-all ${plan.popular
                                    ? "gold-border-glow scale-105 shadow-2xl shadow-amber-500/10"
                                    : "border-border/50 hover:border-border/80"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0">
                                        <Badge className="rounded-none rounded-bl-lg gold-surface border-0 px-3 py-1 text-xs font-semibold">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl">
                                        {PLANS[plan.key].name}
                                    </CardTitle>
                                    <div className="mt-2">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground">
                                            /{plan.period}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {plan.key === "STARTER" ? "Essential tools for small teams" :
                                            plan.key === "PRO" ? "Advanced features for growing businesses" :
                                                "Complete power for large organizations"}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <ul className="space-y-3">
                                        {PLANS[plan.key].features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-2 text-sm"
                                            >
                                                <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full h-11 text-base ${plan.popular
                                            ? "gold-surface border-0 text-black hover:bg-[#cb9b51]"
                                            : ""
                                            }`}
                                        variant={plan.popular ? "default" : "outline"}
                                        asChild
                                    >
                                        <Link href={`/sign-up?plan=${plan.key}`}>
                                            Get Started <ArrowRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12 bg-background/50 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded gold-icon text-xs font-bold text-black">
                                E
                            </div>
                            <span className="text-sm font-semibold">Execufy</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Execufy. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
