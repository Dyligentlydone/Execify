import { HttpChatTransport } from "ai";

console.log("HttpChatTransport exists?", !!HttpChatTransport);
try {
    const t = new HttpChatTransport({ url: "/api/chat" });
    console.log("It accepted { url: '/api/chat' }!");
} catch (e) {
    console.error("Error with 'url':", e.message);
    try {
        const t2 = new HttpChatTransport({ api: "/api/chat" });
        console.log("It accepted { api: '/api/chat' }!");
    } catch (e2) {
        console.error("Error with 'api':", e2.message);
    }
}
