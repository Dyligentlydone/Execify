import { type Expense, RecurringFrequency } from "@/generated/prisma/client";
import { addDays, addWeeks, addMonths, addYears, startOfDay, endOfDay } from "date-fns";

/**
 * Expands recurring expenses into individual occurrences within a given date range.
 * One-time expenses are returned as-is (if they fall within the range).
 */
export function expandRecurringExpenses<T extends { date: Date; type: string; frequency?: RecurringFrequency | null; interval?: number | null; id: string; isActive?: boolean }>(
    expenses: T[],
    rangeStart: Date,
    rangeEnd: Date
): T[] {
    const expanded: T[] = [];
    const normalizedStart = startOfDay(rangeStart);
    const normalizedEnd = endOfDay(rangeEnd);

    for (const exp of expenses) {
        if (exp.type === "ONE_TIME") {
            const d = startOfDay(new Date(exp.date));
            if (d >= normalizedStart && d <= normalizedEnd) {
                expanded.push(exp);
            }
        } else if (exp.type === "RECURRING" && (exp.isActive !== false)) {
            // Start projecting from the expense's date
            // We clone it to avoid mutation
            let current = startOfDay(new Date(exp.date));
            const freq = exp.frequency;
            const interval = exp.interval || 1;

            if (!freq) continue;

            // Generate occurrences until we pass the rangeEnd
            // Note: If the expense started in the future, it correctly generates nothing for the current period.
            // If it started in the past, it catches up.
            let safety = 0;
            while (current <= normalizedEnd && safety < 1000) {
                safety++;
                if (current >= normalizedStart) {
                    expanded.push({
                        ...exp,
                        id: `${exp.id}-${current.getTime()}`,
                        date: new Date(current),
                    });
                }

                // Advance the date
                if (freq === "DAILY") {
                    current = addDays(current, interval);
                } else if (freq === "WEEKLY") {
                    current = addWeeks(current, interval);
                } else if (freq === "MONTHLY") {
                    current = addMonths(current, interval);
                } else if (freq === "YEARLY") {
                    current = addYears(current, interval);
                } else {
                    break;
                }
            }
        }
    }

    return expanded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
