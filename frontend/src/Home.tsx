import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { fetchUsersBooks } from "./api/books"
import BookLink from "./BookLink"
import { getSessionId } from "./utils"

interface Book {
  id: string
  title: string
  author: string
}

export default function Home() {
  const {
    data: booksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allBooks"],
    queryFn: () => fetchUsersBooks(getSessionId()),
  })

  const exampleBooks: Book[] = [
    {
      id: "x0386j3qtvzc",
      title: "The Varieties of Religious Experience: A Study in Human Nature",
      author: "William James",
    },
    {
      id: "8rnttj54y140",
      title: "The Origin of Species by Means of Natural Selection",
      author: "Charles Darwin",
    },
    {
      id: "160hfllea4ll",
      title: "The Federalist Papers",
      author: "Alexander Hamilton et al.",
    },
  ]

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (error || !booksData) {
    console.error("Error loading books:", error)
    return <></>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between gap-4">
        {/* User Books - Left Column */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Books
          </h3>
          <div>
            {booksData.length > 0 ? (
              booksData.map((book) => (
                <BookLink
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                />
              ))
            ) : (
              <p className="text-gray-500">No books uploaded yet</p>
            )}
          </div>
        </div>

        {/* Example Books - Right Column */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Example Books
          </h3>
          <div>
            {exampleBooks.map((book) => (
              <BookLink
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
