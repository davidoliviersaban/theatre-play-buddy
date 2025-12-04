import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export type LLMProvider = "anthropic" | "openai";

export function getDefaultProvider(): LLMProvider {
    const env = (process.env.DEFAULT_LLM_PROVIDER || "").toLowerCase();
    if (env === "anthropic") return "anthropic";
    if (env === "openai") return "openai";
    if (env === "claude") return "anthropic";
    if (env.startsWith("gpt")) return "openai";
    return "openai";
}

export function getModel(provider: LLMProvider = getDefaultProvider()) {
    if (provider === "anthropic") {
        return anthropic("claude-3-5-sonnet-20241022");
    }
    return openai("gpt-4.1-mini");
}
