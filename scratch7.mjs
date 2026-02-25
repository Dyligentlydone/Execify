import { pipeUIMessageStreamToResponse, createUIMessageStreamResponse } from "ai";

console.log("pipe", pipeUIMessageStreamToResponse.toString().split("\n")[0]);
console.log("create", createUIMessageStreamResponse.toString().split("\n")[0]);
