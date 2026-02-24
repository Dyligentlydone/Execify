import { PrismaClient } from './src/generated/prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

const db = new PrismaClient();

function calculateNextRunDate(current: Date, frequency: string, interval: number): Date {
    const next = new Date(current);
    switch (frequency) {
        case "DAILY": return addDays(next, interval);
        case "WEEKLY": return addWeeks(next, interval);
        case "MONTHLY": return addMonths(next, interval);
        case "YEARLY": return addYears(next, interval);
        default: return next;
    }
}

async function testGeneration(templateId: string) {
    const template = await db.recurringInvoice.findUnique({
        where: { id: templateId },
        include: { items: true }
    });

    if (!template) return console.log("Template not found");

    let currentNextRunDate = new Date(template.nextRunDate);
    const now = new Date();
    now.setUTCHours(12, 0, 0, 0);

    console.log(`Starting loop: current=${currentNextRunDate.toISOString()}, now=${now.toISOString()}`);

    try {
        while (currentNextRunDate <= now) {
            console.log(`Generating for ${currentNextRunDate.toISOString()}`);

            await db.$transaction(async (tx) => {
                const count = await tx.invoice.count({ where: { organizationId: template.organizationId } });
                const invoiceNumber = `INV-${(count + 1).toString().padStart(4, "0")}`;

                const intendedDate = new Date(currentNextRunDate);
                intendedDate.setUTCHours(12, 0, 0, 0);

                const nextDate = calculateNextRunDate(intendedDate, template.frequency as any, template.interval);
                nextDate.setUTCHours(12, 0, 0, 0);

                const dueDate = new Date(nextDate);

                console.log(`  -> Creating invoice ${invoiceNumber}, issue=${intendedDate.toISOString()}, due=${dueDate.toISOString()}`);

                await tx.invoice.create({
                    data: {
                        organizationId: template.organizationId,
                        invoiceNumber,
                        contactId: template.contactId,
                        issueDate: intendedDate,
                        dueDate: dueDate,
                        status: "SENT",
                        subtotal: template.subtotal,
                        tax: template.tax,
                        total: template.total,
                        currency: template.currency,
                        createdById: template.createdById,
                        recurringInvoiceId: template.id,
                        notes: template.notes,
                        items: {
                            create: template.items.map(item => ({
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                total: item.total
                            }))
                        }
                    }
                });

                currentNextRunDate = nextDate;

                await tx.recurringInvoice.update({
                    where: { id: template.id },
                    data: { nextRunDate: currentNextRunDate }
                });
                console.log(`  -> Success. Next run date updated to ${currentNextRunDate}`);
            });
        }
    } catch (e) {
        console.error("Caught error during generation loop:", e);
    }
}

testGeneration('cmm0w369v009eqs01cdj7qcsf').then(() => db.$disconnect());
