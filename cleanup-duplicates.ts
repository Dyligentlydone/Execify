import { PrismaClient } from './src/generated/prisma/client';

async function main() {
    const prisma = new PrismaClient();

    // Find Melanie Ragsdale to be safe
    const contact = await prisma.contact.findFirst({
        where: {
            firstName: 'Melanie',
            lastName: 'Ragsdale'
        }
    });

    if (!contact) {
        console.log("Contact not found");
        return;
    }

    console.log(`Found contact: ${contact.id}`);

    // Find "SENT" invoices for today (Feb 23-24 2026 based on the logs)
    // We'll look for duplicates with the same total of 1200
    const duplicates = await prisma.invoice.findMany({
        where: {
            contactId: contact.id,
            status: 'SENT',
            total: 1200,
            createdAt: {
                gte: new Date('2026-02-23T00:00:00Z')
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${duplicates.length} potential duplicates.`);

    // If there's more than 1 (or even if there's 1 and we want to clean it up)
    // Actually, according to screenshot, INV-0003, INV-0004, INV-0005 are all duplicates.
    // INV-0002 was PAID.

    if (duplicates.length > 0) {
        const idsToDelete = duplicates.map(d => d.id);
        console.log(`Deleting IDs: ${idsToDelete.join(', ')}`);

        const deleteResult = await prisma.invoice.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        });

        console.log(`Successfully deleted ${deleteResult.count} duplicate invoices.`);
    }

    await prisma.$disconnect();
}

main().catch(console.error);
