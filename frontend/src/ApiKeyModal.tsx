import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
}

const API_KEY_STORAGE_KEY = "anthropic-api-key"
const MODEL_STORAGE_KEY = "anthropic-model"

export type ModelChoice = "haiku-4-5" | "sonnet-4-5" | "opus-4-5"

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

export function getStoredModel(): ModelChoice {
  return (localStorage.getItem(MODEL_STORAGE_KEY) as ModelChoice) || "haiku-4-5"
}

export function setStoredModel(model: ModelChoice) {
  localStorage.setItem(MODEL_STORAGE_KEY, model)
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState<ModelChoice>("haiku-4-5")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey()
      setApiKey(stored || "")
      setModel(getStoredModel())
      setSaved(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    setStoredApiKey(apiKey.trim() || null)
    setStoredModel(model)
    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const handleClear = () => {
    setApiKey("")
    setStoredApiKey(null)
    setSaved(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Set Claude API Key</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          After the free tier is exhausted, you'll need your own Anthropic API key to generate book outlines.
          Your key is stored locally in your browser.
        </p>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
        <div className={`space-y-2 mb-4 ${!apiKey.trim() ? "opacity-50 pointer-events-none" : ""}`}>
          {[
            { id: "haiku-4-5" as ModelChoice, name: "Haiku 4.5", price: "$0.60", desc: "Fastest" },
            { id: "sonnet-4-5" as ModelChoice, name: "Sonnet 4.5", price: "$1.80", desc: "Balanced" },
            { id: "opus-4-5" as ModelChoice, name: "Opus 4.5", price: "$3.00", desc: "Most capable" },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                model === opt.id
                  ? "border-sky-500 bg-sky-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
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
        {!apiKey.trim() && (
          <p className="text-xs text-gray-500 mb-4">Set API key to unlock model selection</p>
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
