import type { BookOutline, BookSummaries } from "../types/api"

export interface BookData {
  id: string
  title: string
  author: string
  summaries: BookSummaries
  outline: BookOutline
}

export const fetchBook = async (bookId: string): Promise<BookData> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/book/${bookId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch book")
  }
  return response.json()
}
