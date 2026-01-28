import { describe, test, expect, mock, beforeEach } from "bun:test"

// Mock the book count functions before importing the route
const mockCountAllBooks = mock(() => Promise.resolve(0))
const mockCountUserBooks = mock(() => Promise.resolve(0))
const mockFetchUserBooks = mock(() => Promise.resolve([]))

mock.module("../../src/lib/book", () => ({
  countAllBooks: mockCountAllBooks,
  countUserBooks: mockCountUserBooks,
  fetchUserBooks: mockFetchUserBooks,
}))

// Import after mocking
import { Hono } from "hono"

describe("Free Tier Limits", () => {
  beforeEach(() => {
    mockCountAllBooks.mockReset()
    mockCountUserBooks.mockReset()
    mockFetchUserBooks.mockReset()
  })

  describe("GET /book/status", () => {
    test("returns free tier available when under limit", async () => {
      mockCountAllBooks.mockResolvedValue(50)

      // Dynamically import to get fresh module with mocks
      const bookRoute = await import("../../src/routes/book")
      const app = new Hono()
      app.route("/book", bookRoute.default)

      const res = await app.request("/book/status")
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.isFreeTierAvailable).toBe(true)
      expect(data.freeBooksRemaining).toBe(50)
      expect(data.hasApiKey).toBe(false)
      expect(data.availableModels).toEqual(["haiku-4-5"])
    })

    test("returns free tier unavailable when at limit", async () => {
      mockCountAllBooks.mockResolvedValue(100)

      const bookRoute = await import("../../src/routes/book")
      const app = new Hono()
      app.route("/book", bookRoute.default)

      const res = await app.request("/book/status")
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.isFreeTierAvailable).toBe(false)
      expect(data.freeBooksRemaining).toBe(0)
    })

    test("returns all models when API key provided", async () => {
      mockCountAllBooks.mockResolvedValue(50)

      const bookRoute = await import("../../src/routes/book")
      const app = new Hono()
      app.route("/book", bookRoute.default)

      const res = await app.request("/book/status", {
        headers: { "x-anthropic-api-key": "sk-ant-test-key" },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.hasApiKey).toBe(true)
      expect(data.availableModels).toEqual(["haiku-4-5", "sonnet-4-5", "opus-4-5"])
    })
  })

  describe("POST /book/summarize - Free Tier Enforcement", () => {
    test("rejects request when free tier exhausted and no API key", async () => {
      mockCountAllBooks.mockResolvedValue(100)
      mockCountUserBooks.mockResolvedValue(0)

      const bookRoute = await import("../../src/routes/book")
      const app = new Hono()
      app.route("/book", bookRoute.default)

      const formData = new FormData()
      formData.append("file", new File(["test"], "test.epub", { type: "application/epub+zip" }))

      const res = await app.request("/book/summarize", {
        method: "POST",
        headers: { "x-session-id": "test-session" },
        body: formData,
      })
      const data = await res.json()

      expect(res.status).toBe(402)
      expect(data.code).toBe("API_KEY_REQUIRED")
    })

    test("allows request when free tier exhausted but API key provided", async () => {
      mockCountAllBooks.mockResolvedValue(100)
      mockCountUserBooks.mockResolvedValue(0)

      const bookRoute = await import("../../src/routes/book")
      const app = new Hono()
      app.route("/book", bookRoute.default)

      const formData = new FormData()
      formData.append("file", new File(["test"], "test.epub", { type: "application/epub+zip" }))

      const res = await app.request("/book/summarize", {
        method: "POST",
        headers: {
          "x-session-id": "test-session",
          "x-anthropic-api-key": "sk-ant-test-key",
        },
        body: formData,
      })

      // Will fail later in processing (file parsing) but should pass the free tier check
      expect(res.status).not.toBe(402)
    })

    test("allows request when under free tier limit", async () => {
      mockCountAllBooks.mockResolvedValue(50)
      mockCountUserBooks.mockResolvedValue(0)

      const bookRoute = await import("../../src/routes/book")
      const app = new Hono()
      app.route("/book", bookRoute.default)

      const formData = new FormData()
      formData.append("file", new File(["test"], "test.epub", { type: "application/epub+zip" }))

      const res = await app.request("/book/summarize", {
        method: "POST",
        headers: { "x-session-id": "test-session" },
        body: formData,
      })

      // Will fail later in processing but should pass the free tier check
      expect(res.status).not.toBe(402)
    })
  })
})
