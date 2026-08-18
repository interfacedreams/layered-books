import type { BookOutline, BookSummaries } from "../types"
import {
  type ModelChoice,
  getStoredApiKey,
  getStoredModel,
  getStoredOpenAiKey,
} from "../ApiKeyModal"

export interface StatusResponse {
  isFreeTierAvailable: boolean
  freeBooksRemaining: number
  hasApiKey: boolean
  availableModels: string[]
}

export const fetchStatus = async (): Promise<StatusResponse> => {
  const apiKey = getStoredApiKey()
  const headers: Record<string, string> = {}
  if (apiKey) {
    headers["x-anthropic-api-key"] = apiKey
  }
  const openAiKey = getStoredOpenAiKey()
  if (openAiKey) {
    headers["x-openai-api-key"] = openAiKey
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/book/status`, {
    headers,
  })
  if (!response.ok) {
    throw new Error("Failed to fetch status")
  }
  return response.json()
}

export interface BookData {
  id: string
  title: string
  author: string
  summaries: BookSummaries
  outline: BookOutline
}

export interface BookListItem {
  id: string
  title: string
  author: string
}

export interface BookPreview {
  id: string
  title: string
  author: string
}

export const fetchBook = async (
  bookId: string,
  sessionId: string,
): Promise<BookData> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/book/${bookId}`,
    {
      headers: {
        "x-session-id": sessionId,
      },
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch book with id ${bookId}`)
  }
  return response.json()
}

export const fetchUsersBooks = async (
  sessionId: string,
): Promise<BookPreview[]> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/book/all`, {
    headers: {
      "x-session-id": sessionId,
    },
  })
  if (!response.ok) {
    throw new Error(
      `Failed to fetch books for user with session id ${sessionId}`,
    )
  }
  return response.json()
}

export interface UploadOptions {
  file: File
  sessionId: string
  model?: ModelChoice
}

export const uploadBook = async ({
  file,
  sessionId,
}: UploadOptions): Promise<BookPreview> => {
  const formData = new FormData()
  formData.append("file", file)

  const apiKey = getStoredApiKey()
  const model = getStoredModel()
  const headers: Record<string, string> = {
    "x-session-id": sessionId,
    "x-model": model,
  }
  if (apiKey) {
    headers["x-anthropic-api-key"] = apiKey
  }
  const openAiKey = getStoredOpenAiKey()
  if (openAiKey) {
    headers["x-openai-api-key"] = openAiKey
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/book/summarize`,
    {
      method: "POST",
      headers,
      body: formData,
    },
  )

  if (!response.ok) {
    // Handle 402 specifically as it means API key required
    if (response.status === 402) {
      throw new Error("API_KEY_REQUIRED")
    }
    const data = await response.json().catch(() => ({}))
    if (data.code === "API_KEY_REQUIRED") {
      throw new Error("API_KEY_REQUIRED")
    }
    if (data.code === "BOOK_TOO_LARGE") {
      throw new Error(data.details || "Book too large")
    }
    throw new Error(data.error || data.details || "Failed to upload book")
  }

  return response.json()
}
