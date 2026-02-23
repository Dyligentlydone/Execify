import { Metadata } from "next";
import { TaxDashboard } from "./tax-dashboard";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Taxes | Execify",
    description: "Automated tax categorization and schedule C reporting.",
};

export default async function TaxesPage() {
    await requireRole("VIEWER");

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <TaxDashboard />
        </div>
    );
}
