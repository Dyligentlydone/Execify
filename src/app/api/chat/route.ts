import { openai } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getPnLData } from "@/server/actions/financials";
import { createContact } from "@/server/actions/contacts";
import { createInvoice } from "@/server/actions/invoices";
import { createExpense } from "@/server/actions/expenses";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.organizationId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const org = await db.organization.findUnique({
            where: { id: user.organizationId },
            select: { name: true, plan: true }
        });

        if (!org || org.plan === "FREE") {
            return new NextResponse("Premium Required", { status: 403 });
        }

        const { messages, conversationId } = await req.json();

        // 1. Persist user message if conversation exists OR create conversation
        let activeConvId = conversationId;
        const lastUserMsg = messages[messages.length - 1];

        // Extract text from parts or default to empty string
        const userContent = lastUserMsg.parts
            ? lastUserMsg.parts.find((p: any) => p.type === 'text')?.text || ""
            : lastUserMsg.content || "";

        if (!activeConvId) {
            const conv = await db.aIConversation.create({
                data: {
                    organizationId: user.organizationId,
                    userId: user.id,
                    title: "New AI Session",
                    messages: {
                        create: {
                            role: "USER",
                            content: userContent,
                        }
                    }
                }
            });
            activeConvId = conv.id;
        } else {
            await db.aIMessage.create({
                data: {
                    conversationId: activeConvId,
                    role: "USER",
                    content: userContent,
                }
            });
        }

        // Check if this is a relatively new conversation (< 3 messages)
        const msgCount = await db.aIMessage.count({
            where: { conversationId: activeConvId }
        });
        const isNewUserOrConversation = msgCount < 3;

        // Construct System Prompt
        const systemPrompt = `
You are Execufy AI, an expert virtual CFO and business manager.
You are assisting a user from the organization: "${org.name}".

${isNewUserOrConversation ? `
CRITICAL INSTRUCTION: This user appears to be new or starting a fresh session. 
Before diving into complex tasks, you MUST proactively ask 2-3 brief questions to understand their specific business.
For example:
- What industry are they in?
- What are their primary services or products?
- Who is their typical client?
Keep it conversational and friendly. Do not overwhelm them with questions.
` : `You have already established context with this user. Be direct and helpful.`}

You have strict access to the user's financial and CRM data through your tools.
- NEVER make up numbers.
- If they ask for financial summaries, use the getFinancialSummary tool. 
- If they ask to log an expense, use the logExpense tool.
- If they ask to create an invoice, use the createInvoice tool. They MUST identify the customer, the items, and the pricing, ask for it if it's missing. Never invent an invoice.
- Always be professional, crisp, and exact with numbers.
        `.trim();

        // Sanitize the history payload to strip broken blank messages before they crash OpenAI's schema validation
        const sanitizedMessages = messages.filter((m: any) => {
            if (m.role === 'assistant' && !m.content && (!m.toolInvocations || m.toolInvocations.length === 0)) {
                return false;
            }
            return true;
        });

        // Call the AI model
        const result = streamText({
            model: openai("gpt-4o"),
            stopWhen: stepCountIs(5),
            system: systemPrompt,
            messages: sanitizedMessages,
            tools: {
                getFinancialSummary: tool({
                    description: "Get the Year-to-Date (YTD) and current month Profit and Loss data, including revenue, expenses, and margins.",
                    inputSchema: z.object({
                        startDate: z.string().describe("ISO date string for start of period, e.g., '2026-01-01'"),
                        endDate: z.string().describe("ISO date string for end of period, e.g., '2026-12-31'")
                    }).strict(),
                    execute: async ({ startDate, endDate }: any) => {
                        const data = await getPnLData(startDate, endDate);
                        return data;
                    },
                }) as any,
                createContact: tool({
                    description: "Create a new customer/contact in the CRM.",
                    inputSchema: z.object({
                        firstName: z.string(),
                        lastName: z.string(),
                        email: z.string().email().optional(),
                        company: z.string().optional()
                    }).strict(),
                    execute: async (args: any) => {
                        const formData = new FormData();
                        formData.append("firstName", args.firstName);
                        formData.append("lastName", args.lastName);
                        if (args.email) formData.append("email", args.email);
                        if (args.company) formData.append("company", args.company);

                        const res = await createContact(formData);
                        if (res.error) return { error: res.error };
                        return { success: true, contact: res.data };
                    }
                }) as any,
                logExpense: tool({
                    description: "Log a one-time business expense.",
                    inputSchema: z.object({
                        description: z.string(),
                        amount: z.number(),
                        category: z.string(),
                        date: z.string().describe("ISO date e.g. 2026-02-24")
                    }).strict(),
                    execute: async (args: any) => {
                        const formData = new FormData();
                        formData.append("description", args.description);
                        formData.append("amount", args.amount.toString());
                        formData.append("category", args.category);
                        formData.append("date", args.date);
                        formData.append("type", "ONE_TIME");

                        const res = await createExpense(formData);
                        return res;
                    }
                }) as any,
                createInvoice: tool({
                    description: "Create a new invoice and associate it with a client/contact.",
                    inputSchema: z.object({
                        contactId: z.string().describe("The ID of the contact/customer for the invoice."),
                        issueDate: z.string().describe("ISO date string for issue date, e.g., '2026-02-24'"),
                        dueDate: z.string().describe("ISO date string for due date, e.g., '2026-03-26'"),
                        items: z.array(z.object({
                            description: z.string(),
                            quantity: z.number(),
                            unitPrice: z.number()
                        })).min(1).describe("List of line items on the invoice.")
                    }).strict(),
                    execute: async (args: any) => {
                        const formData = new FormData();
                        formData.append("contactId", args.contactId);
                        formData.append("issueDate", args.issueDate);
                        formData.append("dueDate", args.dueDate);
                        formData.append("items", JSON.stringify(args.items));

                        const res = await createInvoice(formData);
                        return res;
                    }
                }) as any
            },
            onFinish: async ({ text, toolCalls, toolResults }) => {
                // Save assistant message to DB
                if (text) {
                    await db.aIMessage.create({
                        data: {
                            conversationId: activeConvId,
                            role: "ASSISTANT",
                            content: text,
                        }
                    });
                }

                // Note: Full tool call logging in DB can be expanded later
                // The AIActionLog is perfect for this, but for MVP we focus on the core chat loop.
            }
        });

        // Add the conversationId to the headers so the client knows what session this is
        // Return stream using the Vercel AI SDK React Hook compatible UI Message Protocol
        return result.toUIMessageStreamResponse({
            headers: {
                "x-conversation-id": activeConvId
            }
        });

    } catch (error) {
        console.error("Chat route error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
