import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const result = streamText({
    model: openai("gpt-4o"),
    prompt: "hi"
});

console.log(Object.keys(result.__proto__ || {}));
console.log(typeof result.toDataStreamResponse);
