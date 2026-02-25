import { DefaultChatTransport, HttpChatTransport } from "ai";
console.log("DefaultChatTransport:", !!DefaultChatTransport);
try {
    const d = new DefaultChatTransport({ url: "/api/chat", body: { conversationId: "123" } });
    console.log("Accepted!", Object.keys(d));
} catch (e) {
    console.log("Error:", e);
}
