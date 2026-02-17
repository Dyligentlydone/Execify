// Preset expense categories based on IRS Schedule C tax write-offs
export const EXPENSE_CATEGORIES = [
    { value: "advertising_marketing", label: "Advertising & Marketing" },
    { value: "car_vehicle", label: "Car & Vehicle Expenses" },
    { value: "commissions_fees", label: "Commissions & Fees" },
    { value: "contract_labor", label: "Contract Labor" },
    { value: "employee_benefits", label: "Employee Benefits" },
    { value: "insurance", label: "Insurance" },
    { value: "interest_loans", label: "Interest (Mortgage/Loans)" },
    { value: "legal_professional", label: "Legal & Professional Services" },
    { value: "office_supplies", label: "Office Expenses & Supplies" },
    { value: "rent_lease", label: "Rent & Lease" },
    { value: "repairs_maintenance", label: "Repairs & Maintenance" },
    { value: "salaries_wages", label: "Salaries & Wages" },
    { value: "taxes_licenses", label: "Taxes & Licenses" },
    { value: "travel", label: "Travel" },
    { value: "meals", label: "Meals (50% Deductible)" },
    { value: "utilities", label: "Utilities" },
    { value: "software_subscriptions", label: "Software & Subscriptions" },
    { value: "depreciation", label: "Depreciation" },
    { value: "education_training", label: "Education & Training" },
    { value: "home_office", label: "Home Office" },
    { value: "other", label: "Other" },
] as const;

export function getCategoryLabel(value: string): string {
    const found = EXPENSE_CATEGORIES.find(c => c.value === value);
    return found ? found.label : value;
}
