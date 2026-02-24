import { PrismaClient } from './src/generated/prisma/client';

async function main() {
    const prisma = new PrismaClient();

    const contact = await prisma.contact.findFirst({
        where: {
            firstName: 'Melanie',
            lastName: 'Ragsdale',
            organizationId: 'cmlsw04m3003blf01pshipwek' // Dyligent org where she belongs
        }
    });

    if (!contact) {
        console.log("Contact Melanie Ragsdale not found in target organization");
        return;
    }

    // Find the latest invoice number to generate a new one correctly (or just use INV-0002.1 or similar if needed)
    // Actually let's find the current max and increment
    const latestInvoice = await prisma.invoice.findFirst({
        where: { organizationId: contact.organizationId },
        orderBy: { invoiceNumber: 'desc' }
    });

    const nextNum = latestInvoice
        ? parseInt(latestInvoice.invoiceNumber.replace('INV-', '')) + 1
        : 2;

    const invoiceNumber = `INV-${nextNum.toString().padStart(4, '0')}`;

    console.log(`Restoring invoice ${invoiceNumber} for ${contact.firstName} ${contact.lastName}`);

    const newInvoice = await prisma.invoice.create({
        data: {
            organizationId: contact.organizationId,
            invoiceNumber: invoiceNumber,
            contactId: contact.id,
            status: 'PAID',
            subtotal: 1200,
            tax: 0,
            total: 1200,
            currency: 'USD',
            issueDate: new Date('2025-09-01T00:00:00Z'),
            dueDate: new Date('2025-09-15T00:00:00Z'),
            paidAt: new Date('2026-02-01T12:00:00Z'), // Paid on Feb 1st
            createdById: contact.createdById,
            notes: "Restored historical invoice",
            items: {
                create: [
                    {
                        description: "Monthly Service (Retained)",
                        quantity: 1,
                        unitPrice: 1200,
                        total: 1200
                    }
                ]
            }
        }
    });

    console.log(`Successfully restored invoice: ${newInvoice.id}`);
    await prisma.$disconnect();
}

main().catch(console.error);
