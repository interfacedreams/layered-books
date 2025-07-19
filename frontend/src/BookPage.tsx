import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useParams } from "react-router-dom"
import { fetchBook } from "./api/books"
import Outline from "./outline/Outline"

export default function BookPage() {
  const { bookId } = useParams<{ bookId: string }>()

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => fetchBook(bookId!),
    enabled: !!bookId,
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (error) {
    console.error("Error loading book:", error)
    return <div className="p-8 text-red-500">Error loading book</div>
  }

  if (!book) {
    return <div className="p-8">Book not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
      <p className="text-xl text-gray-600 mb-8">{book.author}</p>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Outline</h2>
        <Outline outline={book.outline} abstractionLevel={1} />
      </div>
    </div>
  )
}
