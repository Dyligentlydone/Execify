import { type Expense, RecurringFrequency } from "@/generated/prisma/client";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

/**
 * Expands recurring expenses into individual occurrences within a given date range.
 * One-time expenses are returned as-is (if they fall within the range).
 */
export function expandRecurringExpenses<T extends Expense>(expenses: T[], rangeStart: Date, rangeEnd: Date): T[] {
    const expanded: T[] = [];

    for (const exp of expenses) {
        if (exp.type === "ONE_TIME") {
            // One-time expense: only include if within bounds
            const d = new Date(exp.date);
            if (d >= rangeStart && d <= rangeEnd) {
                expanded.push(exp);
            }
        } else if (exp.type === "RECURRING" && exp.isActive) {
            // Recurring expense
            let current = new Date(exp.date);
            const freq = exp.frequency;
            const interval = exp.interval || 1;

            if (!freq) continue;

            // Generate occurrences until we pass the rangeEnd
            while (current <= rangeEnd) {
                if (current >= rangeStart) {
                    expanded.push({
                        ...exp,
                        id: `${exp.id}-${current.getTime()}`, // unique ID for the occurrence
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
                    break; // unknown frequency
                }
            }
        }
    }

    // Sort by date ascending to keep it predictable
    return expanded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
