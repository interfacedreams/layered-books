import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
}

const API_KEY_STORAGE_KEY = "anthropic-api-key"
const OPENAI_KEY_STORAGE_KEY = "openai-api-key"
const MODEL_STORAGE_KEY = "anthropic-model"

// OpenAI models parked until the pipeline limits concurrency — a 200k TPM cap
// can't absorb the current fan-out. Keep in sync with backend models.ts.
export type ModelChoice =
  | "sonnet-5"
  // | "gpt-5.6-sol"
  // | "gpt-5.6-terra"
  // | "gpt-5.6-luna"
  | "haiku-4-5"
  | "sonnet-4-5"
  | "opus-4-5"

export function getStoredApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function setStoredApiKey(key: string | null) {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key)
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  }
}

export function getStoredOpenAiKey(): string | null {
  return localStorage.getItem(OPENAI_KEY_STORAGE_KEY)
}

export function setStoredOpenAiKey(key: string | null) {
  if (key) {
    localStorage.setItem(OPENAI_KEY_STORAGE_KEY, key)
  } else {
    localStorage.removeItem(OPENAI_KEY_STORAGE_KEY)
  }
}

export function getStoredModel(): ModelChoice {
  return (
    (localStorage.getItem(MODEL_STORAGE_KEY) as ModelChoice) || "sonnet-5"
  )
}

export function setStoredModel(model: ModelChoice) {
  localStorage.setItem(MODEL_STORAGE_KEY, model)
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [openAiKey, setOpenAiKey] = useState("")
  const [model, setModel] = useState<ModelChoice>("sonnet-5")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey() || "")
      setOpenAiKey(getStoredOpenAiKey() || "")
      setModel(getStoredModel())
      setSaved(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    setStoredApiKey(apiKey.trim() || null)
    setStoredOpenAiKey(openAiKey.trim() || null)
    setStoredModel(model)
    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const handleClear = () => {
    setApiKey("")
    setOpenAiKey("")
    setStoredApiKey(null)
    setStoredOpenAiKey(null)
    setSaved(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Set API Keys</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          After the free tier is exhausted, you'll need your own OpenAI or
          Anthropic API key to generate book outlines. Your keys are stored
          locally in your browser.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API key</label>
        <input
          type="password"
          value={openAiKey}
          onChange={(e) => setOpenAiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Anthropic API key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
        <div className={`space-y-2 mb-4 ${!apiKey.trim() && !openAiKey.trim() ? "opacity-50 pointer-events-none" : ""}`}>
          {/*
            Prices are per-book on a ~116k-word reference book (Nicomachean
            Ethics). Sonnet 5 and Haiku 4.5 are measured from real runs; the
            rest apply current per-token rates to the measured Haiku token
            counts, so they are close but not confirmed. OpenAI models use a
            different tokenizer, which makes those three the softest figures —
            measure one before treating them as exact. Each is rounded up to the
            next 10c so the quote is never under what the run actually costs.
          */}
          {[
            { id: "sonnet-5" as ModelChoice, name: "Sonnet 5", price: "$1.90", desc: "Default · Recommended", needsKey: apiKey.trim() },
            { id: "opus-4-5" as ModelChoice, name: "Opus 4.5", price: "$3.30", desc: "Most capable", needsKey: apiKey.trim() },
            { id: "sonnet-4-5" as ModelChoice, name: "Sonnet 4.5", price: "$2.00", desc: "Balanced", needsKey: apiKey.trim() },
            { id: "haiku-4-5" as ModelChoice, name: "Haiku 4.5", price: "$0.70", desc: "Fastest", needsKey: apiKey.trim() },
            // { id: "gpt-5.6-sol" as ModelChoice, name: "GPT-5.6 Sol", price: "$3.50", desc: "OpenAI · Most capable", needsKey: openAiKey.trim() },
            // { id: "gpt-5.6-terra" as ModelChoice, name: "GPT-5.6 Terra", price: "$1.40", desc: "OpenAI · Balanced", needsKey: openAiKey.trim() },
            // { id: "gpt-5.6-luna" as ModelChoice, name: "GPT-5.6 Luna", price: "$0.20", desc: "OpenAI · Cheapest", needsKey: openAiKey.trim() },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                model === opt.id
                  ? "border-sky-500 bg-sky-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${!opt.needsKey ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="model"
                  value={opt.id}
                  checked={model === opt.id}
                  onChange={(e) => setModel(e.target.value as ModelChoice)}
                  className="text-sky-500"
                />
                <div>
                  <span className="font-medium text-gray-900">{opt.name}</span>
                  <span className="text-gray-500 text-sm ml-2">{opt.desc}</span>
                </div>
              </div>
              <span className="text-sm text-gray-600">~{opt.price}<span className="text-xs text-gray-400">/book</span></span>
            </label>
          ))}
        </div>
        {!apiKey.trim() && !openAiKey.trim() && (
          <p className="text-xs text-gray-500 mb-4">Set an API key to unlock model selection</p>
        )}

        {saved && (
          <p className="text-sm text-green-600 mb-4">Saved!</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 cursor-pointer transition-colors font-medium"
          >
            Save
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer transition-colors text-gray-700"
          >
            Clear
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Get your API key from{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>
    </div>
  )
}
