import Link from "next/link";
import {
  ArrowRight,
  Bot,
  LayoutDashboard,
  Shield,
  Zap,
  Users,
  BarChart3,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/stripe";
import { AnimatedWord } from "@/components/ui/animated-word";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Custom Dashboards",
    description:
      "Drag-and-drop widgets to build your perfect command center. Save multiple views for different workflows.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "Natural language commands to query your data, create tasks, generate invoices, and manage your business.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "CRM & Pipeline",
    description:
      "Full contact management and deal tracking with customizable pipeline stages.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description:
      "Real-time revenue tracking, invoice management, and financial insights all in one place.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Multi-tenant architecture with role-based access control. Your data is always isolated and secure.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Zap,
    title: "Integrations",
    description:
      "Connect Stripe, Twilio, QuickBooks, and more. External data is normalized into your unified dashboard.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const PLAN_LIST = [
  { key: "STARTER" as const, price: "$29", period: "month", popular: false },
  { key: "PRO" as const, price: "$79", period: "month", popular: true },
  { key: "EXECUTIVE" as const, price: "$199", period: "month", popular: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gold-icon text-sm font-bold text-black">
              E
            </div>
            <span className="text-lg font-bold tracking-tight">Execufy</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              className="gold-surface border-0"
            >
              <Link href="/pricing">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background gradient effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-[#cb9b51]/20 via-[#8b6914]/10 to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-gradient-to-bl from-cyan-500/10 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your Business,{" "}
            <span className="gold-text">
              One Command
            </span>{" "}
            Center
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A future proof command center that brings your customer relations, finances, operations and more into one powerful dashboard.
            <br />
            <br />
            <span className="italic flex flex-wrap items-center justify-center gap-x-1">
              -Execufy, your intelligent executive partner. Always{" "}
              <AnimatedWord />
              .
            </span>
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="gold-surface border-0 px-8 text-base h-12"
            >
              <Link href="/pricing">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to{" "}
              <span className="gold-text-simple">
                run your business
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete suite of tools designed for business owners who want
              clarity, control, and AI-powered intelligence.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all hover:border-border hover:shadow-lg"
              >
                <CardHeader>
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient}`}
                  >
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
                {/* Hover glow */}
                <div className="absolute inset-0 -z-10 transition-opacity opacity-0 group-hover:opacity-100">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 sm:py-32 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that scales with your business.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {PLAN_LIST.map((plan) => (
              <Card
                key={plan.key}
                className={`relative overflow-hidden transition-all ${plan.popular
                  ? "gold-border-glow scale-105"
                  : "border-border/50"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg gold-surface border-0">
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
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
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
                    className={`w-full ${plan.popular
                      ? "gold-surface border-0"
                      : ""
                      }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative px-6 py-16 text-center sm:px-12 sm:py-24">
            <h2 className="relative text-3xl font-bold gold-text sm:text-4xl">
              Ready to take command?
            </h2>
            <p className="relative mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Join the next generation of business leaders operating from one intelligent command center.
            </p>
            <Button
              size="lg"
              asChild
              className="relative mt-8 gold-surface text-black border-0 shadow-[0_0_20px_rgba(203,155,81,0.3)] hover:shadow-[0_0_35px_rgba(203,155,81,0.6)] transition-all duration-300 h-12 px-8 text-base font-semibold"
            >
              <Link href="/pricing">
                Execufy <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
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
