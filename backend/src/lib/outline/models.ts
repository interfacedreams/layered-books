import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"

// OpenAI models are parked until the pipeline bounds its concurrency: the
// unbounded Promise.all fan-out in orchestrate.ts pushes ~500k tokens through
// in a couple of minutes, which blows a 200k TPM limit and silently drops most
// section details. The provider plumbing below is left intact — re-enable by
// uncommenting these three ids and their MODEL_CONFIG entries, plus the
// matching blocks in routes/book.ts and the frontend ApiKeyModal.
export type ModelChoice =
  | "sonnet-5"
  // | "gpt-5.6-sol"
  // | "gpt-5.6-terra"
  // | "gpt-5.6-luna"
  | "haiku-4-5"
  | "sonnet-4-5"
  | "opus-4-5"

export const DEFAULT_MODEL: ModelChoice = "sonnet-5"

type Provider = "openai" | "anthropic"

const MODEL_CONFIG: Record<ModelChoice, { provider: Provider; id: string }> = {
  "sonnet-5": { provider: "anthropic", id: "claude-sonnet-5" },
  // "gpt-5.6-sol": { provider: "openai", id: "gpt-5.6-sol" },
  // "gpt-5.6-terra": { provider: "openai", id: "gpt-5.6-terra" },
  // "gpt-5.6-luna": { provider: "openai", id: "gpt-5.6-luna" },
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

// Chapter extraction emits one JSON entry per chapter, so a long book can run
// past a low output cap. When it does, the response is cut off mid-object,
// parses to {}, and the whole upload fails with "No chapters generated" — a
// 21-chapter book hit this on Sonnet 5 back when the provider did not
// recognise the model id and fell back to a 4096-token default. The provider
// now reports each model's real ceiling (128k for Sonnet 5), so this is a
// deliberate cost and latency guard rather than a workaround. It is a ceiling,
// not a target; raise it if a book ever outgrows it.
const MAX_OUTPUT_TOKENS = 16000

// GPT-5.6 and Claude Sonnet 5 reject non-default temperature, so only the older
// Claude models get 0.3.
export const getGenerationSettings = (model: ModelChoice = DEFAULT_MODEL) => {
  const base = { maxOutputTokens: MAX_OUTPUT_TOKENS }
  if (MODEL_CONFIG[model].provider === "openai") return base
  return model === "sonnet-5" ? base : { ...base, temperature: 0.3 }
}
