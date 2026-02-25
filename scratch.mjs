import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const result = streamText({
    model: openai("gpt-4o"),
    prompt: "hi"
});

console.log("Methods:", Object.keys(result).filter(k => typeof result[k] === 'function'));
console.log("Full Object:", Object.keys(result));
