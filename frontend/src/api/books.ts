import type { BookOutline, BookSummaries } from "../types"

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
