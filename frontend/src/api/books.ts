import type { BookOutline, BookSummaries } from "../types"

export interface BookData {
  id: string
  title: string
  author: string
  summaries: BookSummaries
  outline: BookOutline
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
    throw new Error("Failed to fetch book")
  }
  return response.json()
}
