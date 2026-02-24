import { PrismaClient } from './src/generated/prisma/client';

async function main() {
    const prisma = new PrismaClient();

    const targetInvoices = await prisma.invoice.findMany({
        where: {
            contact: {
                firstName: 'Melanie',
                lastName: 'Ragsdale'
            }
        },
        include: { contact: true },
        orderBy: { createdAt: 'desc' }
    });

    console.log("--- INVOICES FOR MELANIE RAGSDALE ---");
    targetInvoices.forEach(inv => {
        console.log(`${inv.invoiceNumber} (${inv.id}):`);
        console.log(`  Status: ${inv.status}`);
        console.log(`  Total: ${inv.total}`);
        console.log(`  Issue: ${inv.issueDate.toISOString()}`);
        console.log(`  PaidAt: ${inv.paidAt?.toISOString()}`);
        console.log(`  CreatedAt: ${inv.createdAt.toISOString()}`);
        console.log(`  Recurring ID: ${inv.recurringInvoiceId}`);
        console.log("");
    });

    await prisma.$disconnect();
}

main().catch(console.error);
