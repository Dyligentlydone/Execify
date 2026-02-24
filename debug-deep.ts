import { PrismaClient } from './src/generated/prisma/client';

async function main() {
    const prisma = new PrismaClient();

    console.log("--- RECURRING INVOICES ---");
    const recurring = await prisma.recurringInvoice.findMany({
        include: {
            generatedInvoices: {
                orderBy: { issueDate: 'desc' },
                take: 5
            },
            contact: true
        }
    });

    recurring.forEach(ri => {
        console.log(`Plan: ${ri.name} (${ri.id})`);
        console.log(`  Customer: ${ri.contact?.firstName} ${ri.contact?.lastName}`);
        console.log(`  Frequency: ${ri.frequency} (Interval: ${ri.interval})`);
        console.log(`  Next Run Date: ${ri.nextRunDate.toISOString()}`);
        console.log(`  Start Date: ${ri.startDate.toISOString()}`);
        console.log(`  Generated Invoices:`);
        ri.generatedInvoices.forEach(inv => {
            console.log(`    - ${inv.invoiceNumber}: Issue=${inv.issueDate.toISOString()}, Due=${inv.dueDate?.toISOString()}, PaidAt=${inv.paidAt?.toISOString()}, Status=${inv.status}`);
        });
        console.log("");
    });

    console.log("\n--- ALL INVOICES (FOR THESE CLIENTS) ---");
    const contacts = ["Alex Acme", "Melanie Ragsdale"];
    const targetInvoices = await prisma.invoice.findMany({
        where: {
            OR: [
                { contact: { firstName: 'Alex', lastName: 'Acme ' } }, // Note the space in Acme
                { contact: { firstName: 'Melanie', lastName: 'Ragsdale' } }
            ]
        },
        include: { contact: true },
        orderBy: { issueDate: 'desc' }
    });

    targetInvoices.forEach(inv => {
        console.log(`${inv.invoiceNumber} (${inv.id}):`);
        console.log(`  Customer: ${inv.contact?.firstName} ${inv.contact?.lastName}`);
        console.log(`  Status: ${inv.status}`);
        console.log(`  Total: ${inv.total}`);
        console.log(`  Issue Date: ${inv.issueDate.toISOString()}`);
        console.log(`  Due Date: ${inv.dueDate?.toISOString()}`);
        console.log(`  Paid At: ${inv.paidAt?.toISOString()}`);
        console.log(`  Created At: ${inv.createdAt.toISOString()}`);
        console.log(`  Recurring ID: ${inv.recurringInvoiceId}`);
        console.log("");
    });

    await prisma.$disconnect();
}

main().catch(console.error);
