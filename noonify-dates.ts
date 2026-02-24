import { PrismaClient } from './src/generated/prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const orgId = 'cmlsw04m3003blf01pshipwek';

    const invoices = await prisma.invoice.findMany({
        where: { organizationId: orgId }
    });

    console.log(`Checking ${invoices.length} invoices...`);

    for (const inv of invoices) {
        const newIssue = new Date(inv.issueDate);
        newIssue.setUTCHours(12, 0, 0, 0);

        const newDue = inv.dueDate ? new Date(inv.dueDate) : null;
        if (newDue) newDue.setUTCHours(12, 0, 0, 0);

        const newPaid = inv.paidAt ? new Date(inv.paidAt) : null;
        // For paidAt, we don't necessarily NEED noon, but let's make sure it's at least clearly in the right day
        // Actually for paidAt, let's keep it as is unless it's very close to midnight.
        // But for consistency let's set it to noon if it was manual.

        await prisma.invoice.update({
            where: { id: inv.id },
            data: {
                issueDate: newIssue,
                dueDate: newDue
            }
        });
    }

    // Also Noonify the nextRunDate on recurring plans
    const recurring = await prisma.recurringInvoice.findMany({
        where: { organizationId: orgId }
    });

    for (const ri of recurring) {
        const newNext = new Date(ri.nextRunDate);
        newNext.setUTCHours(12, 0, 0, 0);

        const newStart = new Date(ri.startDate);
        newStart.setUTCHours(12, 0, 0, 0);

        await prisma.recurringInvoice.update({
            where: { id: ri.id },
            data: {
                nextRunDate: newNext,
                startDate: newStart
            }
        });
    }

    console.log("Noonification complete.");
    await prisma.$disconnect();
}

main().catch(console.error);
