"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subYears } from "date-fns";

type DateRange = {
    startDate: string;
    endDate: string;
    label: string;
};

type Props = {
    value: DateRange;
    onChange: (range: DateRange) => void;
};

function getPresets(): DateRange[] {
    const now = new Date();
    return [
        {
            label: "This Month",
            startDate: format(startOfMonth(now), "yyyy-MM-dd"),
            endDate: format(endOfMonth(now), "yyyy-MM-dd"),
        },
        {
            label: "Last Month",
            startDate: format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd"),
            endDate: format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd"),
        },
        {
            label: "This Quarter",
            startDate: format(startOfQuarter(now), "yyyy-MM-dd"),
            endDate: format(endOfQuarter(now), "yyyy-MM-dd"),
        },
        {
            label: "Year to Date",
            startDate: format(startOfYear(now), "yyyy-MM-dd"),
            endDate: format(now, "yyyy-MM-dd"),
        },
        {
            label: "Last Year",
            startDate: format(startOfYear(subYears(now, 1)), "yyyy-MM-dd"),
            endDate: format(endOfYear(subYears(now, 1)), "yyyy-MM-dd"),
        },
    ];
}

export function DateRangePicker({ value, onChange }: Props) {
    const [showCustom, setShowCustom] = useState(false);
    const [customStart, setCustomStart] = useState(value.startDate);
    const [customEnd, setCustomEnd] = useState(value.endDate);
    const presets = getPresets();

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            onChange({
                label: `${format(new Date(customStart), "MMM d")} – ${format(new Date(customEnd), "MMM d, yyyy")}`,
                startDate: customStart,
                endDate: customEnd,
            });
            setShowCustom(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{value.label}</span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                    {presets.map((preset) => (
                        <DropdownMenuItem
                            key={preset.label}
                            onClick={() => {
                                onChange(preset);
                                setShowCustom(false);
                            }}
                            className={value.label === preset.label ? "bg-accent" : ""}
                        >
                            {preset.label}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowCustom(true)}>
                        Custom Range…
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {showCustom && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="h-9 w-[140px] text-xs"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="h-9 w-[140px] text-xs"
                    />
                    <Button size="sm" onClick={handleCustomApply} className="h-9 text-xs">
                        Apply
                    </Button>
                </div>
            )}
        </div>
    );
}
