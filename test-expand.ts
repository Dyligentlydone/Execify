import { addMonths } from "date-fns";

type Expense = { id: string; type: string; date: Date; isActive?: boolean; frequency?: string; interval?: number; amount: string };

function expandRecurringExpenses(expenses: Expense[], rangeStart: Date, rangeEnd: Date): Expense[] {
    const expanded: Expense[] = [];

    for (const exp of expenses) {
        if (exp.type === "ONE_TIME") {
            const d = new Date(exp.date);
            if (d >= rangeStart && d <= rangeEnd) {
                expanded.push(exp);
            }
        } else if (exp.type === "RECURRING" && exp.isActive) {
            let current = new Date(exp.date);
            const freq = exp.frequency;
            const interval = exp.interval || 1;

            if (!freq) continue;

            while (current <= rangeEnd) {
                if (current >= rangeStart) {
                    expanded.push({
                        ...exp,
                        id: `${exp.id}-${current.getTime()}`,
                        date: new Date(current),
                    });
                }

                 if (freq === "DAILY") {
                    current.setDate(current.getDate() + interval);
                } else if (freq === "WEEKLY") {
                    current.setDate(current.getDate() + interval * 7);
                } else if (freq === "MONTHLY") {
                    current = addMonths(current, interval);
                } else if (freq === "YEARLY") {
                    current.setFullYear(current.getFullYear() + interval);
                } else {
                    break;
                }
            }
        }
    }

    return expanded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

const exp: Expense = {
  id: "1", type: "RECURRING", date: new Date("2026-02-18T00:00:00Z"), isActive: true, frequency: "MONTHLY", interval: 1, amount: "40"
};

const res = expandRecurringExpenses([exp], new Date("2026-01-01T00:00:00Z"), new Date("2026-12-31T23:59:59Z"));
console.log(res.length, "expenses");
