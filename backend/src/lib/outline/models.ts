import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"

export type ModelChoice =
  | "sonnet-5"
  | "gpt-5.6-sol"
  | "haiku-4-5"
  | "sonnet-4-5"
  | "opus-4-5"

export const DEFAULT_MODEL: ModelChoice = "sonnet-5"

type Provider = "openai" | "anthropic"

const MODEL_CONFIG: Record<ModelChoice, { provider: Provider; id: string }> = {
  "sonnet-5": { provider: "anthropic", id: "claude-sonnet-5" },
  "gpt-5.6-sol": { provider: "openai", id: "gpt-5.6-sol" },
  "haiku-4-5": { provider: "anthropic", id: "claude-haiku-4-5" },
  "sonnet-4-5": { provider: "anthropic", id: "claude-sonnet-4-5" },
  "opus-4-5": { provider: "anthropic", id: "claude-opus-4-5" },
}

export const modelProvider = (model: ModelChoice): Provider =>
  MODEL_CONFIG[model].provider

// apiKey is the user's key for the chosen model's provider; without it the
// client falls back to the server's OPENAI_API_KEY / ANTHROPIC_API_KEY env vars
export const getModel = (
  apiKey?: string,
  model: ModelChoice = DEFAULT_MODEL,
) => {
  const { provider, id } = MODEL_CONFIG[model]
  if (provider === "openai") {
    const client = apiKey ? createOpenAI({ apiKey }) : createOpenAI()
    return client(id)
  }
  const client = apiKey ? createAnthropic({ apiKey }) : createAnthropic()
  return client(id)
}

// GPT-5.6 and Claude Sonnet 5 reject non-default temperature, so only the
// older Claude models get 0.3. serviceTier "fast" opts Sol into Fast mode
// (2x price, ~2.5x speed).
export const getGenerationSettings = (model: ModelChoice = DEFAULT_MODEL) => {
  if (MODEL_CONFIG[model].provider === "openai") {
    return { providerOptions: { openai: { serviceTier: "fast" as const } } }
  }
  return model === "sonnet-5" ? {} : { temperature: 0.3 }
}
