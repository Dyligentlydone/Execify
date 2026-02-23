"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Calculator,
    Bot,
    Download,
    Loader2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Receipt,
    Landmark,
    Check,
    ChevronsUpDown
} from "lucide-react";
import { toast } from "sonner";
import { getTaxSummary, categorizeExpensesWithAI } from "@/server/actions/tax-engine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TAX_PROFILES = [
    { value: "standard", label: "Standard US (15.3% SE + ~15% Income)", rate: 30.0 },
    { value: "custom", label: "Custom Rate...", rate: -1 },
    { value: "alabama", label: "Alabama (+5.0%)", rate: 35.0 },
    { value: "alaska", label: "Alaska (+0.0%)", rate: 30.0 },
    { value: "arizona", label: "Arizona (+2.5%)", rate: 32.5 },
    { value: "arkansas", label: "Arkansas (+4.4%)", rate: 34.4 },
    { value: "california", label: "California (+13.3%)", rate: 43.3 },
    { value: "colorado", label: "Colorado (+4.4%)", rate: 34.4 },
    { value: "connecticut", label: "Connecticut (+6.99%)", rate: 36.99 },
    { value: "delaware", label: "Delaware (+6.6%)", rate: 36.6 },
    { value: "florida", label: "Florida (+0.0%)", rate: 30.0 },
    { value: "georgia", label: "Georgia (+5.49%)", rate: 35.49 },
    { value: "hawaii", label: "Hawaii (+11.0%)", rate: 41.0 },
    { value: "idaho", label: "Idaho (+5.8%)", rate: 35.8 },
    { value: "illinois", label: "Illinois (+4.95%)", rate: 34.95 },
    { value: "indiana", label: "Indiana (+3.05%)", rate: 33.05 },
    { value: "iowa", label: "Iowa (+5.7%)", rate: 35.7 },
    { value: "kansas", label: "Kansas (+5.7%)", rate: 35.7 },
    { value: "kentucky", label: "Kentucky (+4.0%)", rate: 34.0 },
    { value: "louisiana", label: "Louisiana (+4.25%)", rate: 34.25 },
    { value: "maine", label: "Maine (+7.15%)", rate: 37.15 },
    { value: "maryland", label: "Maryland (+5.75%)", rate: 35.75 },
    { value: "massachusetts", label: "Massachusetts (+5.0%)", rate: 35.0 },
    { value: "michigan", label: "Michigan (+4.25%)", rate: 34.25 },
    { value: "minnesota", label: "Minnesota (+9.85%)", rate: 39.85 },
    { value: "mississippi", label: "Mississippi (+4.7%)", rate: 34.7 },
    { value: "missouri", label: "Missouri (+4.95%)", rate: 34.95 },
    { value: "montana", label: "Montana (+5.9%)", rate: 35.9 },
    { value: "nebraska", label: "Nebraska (+5.84%)", rate: 35.84 },
    { value: "nevada", label: "Nevada (+0.0%)", rate: 30.0 },
    { value: "new-hampshire", label: "New Hampshire (+0.0%)", rate: 30.0 },
    { value: "new-jersey", label: "New Jersey (+10.75%)", rate: 40.75 },
    { value: "new-mexico", label: "New Mexico (+5.9%)", rate: 35.9 },
    { value: "new-york", label: "New York (+10.9%)", rate: 40.9 },
    { value: "north-carolina", label: "North Carolina (+4.5%)", rate: 34.5 },
    { value: "north-dakota", label: "North Dakota (+2.5%)", rate: 32.5 },
    { value: "ohio", label: "Ohio (+3.5%)", rate: 33.5 },
    { value: "oklahoma", label: "Oklahoma (+4.75%)", rate: 34.75 },
    { value: "oregon", label: "Oregon (+9.9%)", rate: 39.9 },
    { value: "pennsylvania", label: "Pennsylvania (+3.07%)", rate: 33.07 },
    { value: "rhode-island", label: "Rhode Island (+5.99%)", rate: 35.99 },
    { value: "south-carolina", label: "South Carolina (+6.4%)", rate: 36.4 },
    { value: "south-dakota", label: "South Dakota (+0.0%)", rate: 30.0 },
    { value: "tennessee", label: "Tennessee (+0.0%)", rate: 30.0 },
    { value: "texas", label: "Texas (+0.0%)", rate: 30.0 },
    { value: "utah", label: "Utah (+4.55%)", rate: 34.55 },
    { value: "vermont", label: "Vermont (+8.75%)", rate: 38.75 },
    { value: "virginia", label: "Virginia (+5.75%)", rate: 35.75 },
    { value: "washington", label: "Washington (+0.0%)", rate: 30.0 },
    { value: "west-virginia", label: "West Virginia (+4.25%)", rate: 34.25 },
    { value: "wisconsin", label: "Wisconsin (+7.65%)", rate: 37.65 },
    { value: "wyoming", label: "Wyoming (+0.0%)", rate: 30.0 },
    { value: "puerto-rico", label: "Puerto Rico (Act 60 - ~4%)", rate: 4.0 }
];

type TaxData = Awaited<ReturnType<typeof getTaxSummary>>;

export function TaxDashboard() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<TaxData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAiCategorizing, startAiTransition] = useTransition();

    const [taxProfile, setTaxProfile] = useState("standard");
    const [customRate, setCustomRate] = useState(30);
    const [comboboxOpen, setComboboxOpen] = useState(false);

    const getEffectiveTaxRate = () => {
        if (taxProfile === "custom") return customRate;
        const profile = TAX_PROFILES.find((p) => p.value === taxProfile);
        return profile ? profile.rate : 30;
    };
    const effectiveRate = getEffectiveTaxRate();

    const loadData = async () => {
        setIsLoading(true);
        try {
            const summary = await getTaxSummary(year);
            setData(summary);
        } catch (error) {
            toast.error("Failed to load tax data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [year]);

    const handleAutoCategorize = () => {
        startAiTransition(async () => {
            const res = await categorizeExpensesWithAI(year);
            if (res.success) {
                toast.success(`AI categorized ${res.count} expenses successfully!`);
                await loadData();
            } else {
                toast.error(res.error || "Failed to categorize");
            }
        });
    };

    const handleExportCSV = () => {
        if (!data) return;

        // Simple CSV generation for the summary
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Tax Year:,${data.year}\n`;
        csvContent += `Gross Receipts (Part I):,$${data.grossReceipts.toFixed(2)}\n`;
        csvContent += `Total Deductions (Part II):,$${data.totalDeductions.toFixed(2)}\n`;
        csvContent += `Net Profit:,$${data.netProfit.toFixed(2)}\n\n`;
        csvContent += "Itemized Deductions (Schedule C Categories)\n";
        csvContent += "Category,Amount\n";

        Object.entries(data.categories).forEach(([category, expenses]) => {
            const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
            csvContent += `"${category}",$${total.toFixed(2)}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Tax_Summary_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-primary" />
                        Tax Engine
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Automated Schedule C categorization for {year}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none"
                    >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                    </select>
                    <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {data.uncategorizedCount > 0 && (
                <Alert className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Action Required: Uncategorized Expenses</AlertTitle>
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                        <span>
                            You have <strong>{data.uncategorizedCount}</strong> expenses that have not been assigned to an IRS tax category.
                            The AI can automatically read the receipts and descriptions to map these into exactly the right Schedule C boxes.
                        </span>
                        <Button
                            onClick={handleAutoCategorize}
                            disabled={isAiCategorizing}
                            className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap gap-2"
                        >
                            {isAiCategorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                            Auto-Categorize with AI
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Gross Receipts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${data.grossReceipts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">From all paid invoices</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${data.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">Calculated from categorized expenses</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-sm border-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Est. Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">${data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-primary/80 mt-1">Taxable business income</p>
                    </CardContent>
                </Card>

                <Dialog>
                    <DialogTrigger asChild>
                        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 shadow-sm cursor-pointer hover:border-amber-500/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-amber-600">Est. Tax Owed (Edit)</CardTitle>
                                <Landmark className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-600">${(data.netProfit * (effectiveRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <p className="text-xs text-amber-600/80 mt-1">~{effectiveRate}% safe holdback</p>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Estimated Tax Calculation</DialogTitle>
                            <DialogDescription>
                                Adjust your tax profile to get a more accurate estimate of how much you should hold back.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2 flex flex-col">
                                <Label>Tax Location / Profile</Label>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between"
                                        >
                                            {TAX_PROFILES.find((p) => p.value === taxProfile)?.label || "Select State..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search state or province..." />
                                            <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                                                <CommandEmpty>No state found.</CommandEmpty>
                                                <CommandGroup>
                                                    {TAX_PROFILES.map((profile) => (
                                                        <CommandItem
                                                            key={profile.value}
                                                            value={profile.label}
                                                            onSelect={() => {
                                                                setTaxProfile(profile.value);
                                                                setComboboxOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    taxProfile === profile.value ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {profile.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {taxProfile === "custom" && (
                                <div className="space-y-2">
                                    <Label htmlFor="custom-rate">Custom Effective Rate (%)</Label>
                                    <Input
                                        id="custom-rate"
                                        type="number"
                                        value={customRate}
                                        onChange={(e) => setCustomRate(Number(e.target.value))}
                                        placeholder="e.g. 25"
                                    />
                                </div>
                            )}

                            <div className="bg-muted p-4 rounded-lg mt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Net Profit:</span>
                                    <span>${data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Effective Tax Rate:</span>
                                    <span>{effectiveRate}%</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between font-bold text-amber-600">
                                    <span>Estimated Tax Owed:</span>
                                    <span>${(data.netProfit * (effectiveRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Schedule C Itemized Deductions</CardTitle>
                    <CardDescription>
                        Copy these exact totals into your tax software.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(data.categories).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <Receipt className="h-8 w-8 opacity-20 mx-auto mb-2" />
                                No categorized expenses found for this year.
                            </div>
                        ) : (
                            Object.entries(data.categories).map(([category, expenses]) => {
                                const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                                const isUncategorized = category === "Uncategorized";

                                return (
                                    <div key={category} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-md ${isUncategorized ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                                {isUncategorized ? <AlertCircle className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {category}
                                                    {isUncategorized && <Badge variant="destructive" className="text-[10px] h-4">Action Needed</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{expenses.length} transactions</div>
                                            </div>
                                        </div>
                                        <div className="font-mono font-medium">
                                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
