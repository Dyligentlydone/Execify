import { Suspense } from "react";
import {
    Users,
    Briefcase,
    ListTodo,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDashboardStats } from "@/server/actions/stats";

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    const STATS = [
        {
            title: "Total Revenue",
            value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(stats.totalRevenue),
            icon: DollarSign,
            description: "Total paid invoices",
            trend: "up" as const,
            trendValue: "+12%", // Placeholder
        },
        {
            title: "Active Contacts",
            value: stats.totalContacts.toString(),
            icon: Users,
            description: "Total active customers",
            trend: "up" as const,
            trendValue: "+4%",
        },
        {
            title: "Open Deals",
            value: stats.openDealsCount.toString(),
            icon: Briefcase,
            description: `Value: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(stats.openDealsValue)}`,
            trend: "neutral" as const,
            trendValue: "0%",
        },
        {
            title: "Pending Tasks",
            value: stats.pendingTasks.toString(),
            icon: ListTodo,
            description: "Tasks marked as TODO",
            trend: "down" as const,
            trendValue: "-2%",
        },
    ];

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center gap-2">
                {/* Sidebar Trigger Placeholder if needed */}
                <div className="flex flex-col">
                    <h1 className="text-xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of your business performance.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {STATS.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                {stat.trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3 text-green-500" /> :
                                    stat.trend === 'down' ? <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" /> :
                                        null}
                                <span className={stat.trend === 'up' ? "text-green-500" : stat.trend === 'down' ? "text-red-500" : ""}>
                                    {stat.trendValue}
                                </span>
                                <span className="ml-1">{stat.description}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your team's latest actions across the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground border-2 border-dashed rounded-lg bg-muted/50">
                            Activity Feed Widget (Coming Soon)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks and shortcuts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button className="w-full justify-start h-10" variant="outline" asChild>
                            <a href="/contacts">
                                <Users className="mr-2 h-4 w-4 text-blue-500" /> Add Contact
                            </a>
                        </Button>
                        <Button className="w-full justify-start h-10" variant="outline" asChild>
                            <a href="/deals">
                                <Briefcase className="mr-2 h-4 w-4 text-purple-500" /> Create Deal
                            </a>
                        </Button>
                        <Button className="w-full justify-start h-10" variant="outline" asChild>
                            <a href="/tasks">
                                <ListTodo className="mr-2 h-4 w-4 text-amber-500" /> Add Task
                            </a>
                        </Button>
                        <Button className="w-full justify-start h-10" variant="outline" asChild>
                            <a href="/invoices">
                                <DollarSign className="mr-2 h-4 w-4 text-green-500" /> Create Invoice
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
