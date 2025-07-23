import BookLink from "./BookLink"

interface Book {
  id: string
  title: string
  author: string
}

export default function Home() {
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

  const userBooks: Book[] = [
    {
      id: "user-1",
      title: "My Personal Journal",
      author: "You",
    },
    {
      id: "user-2",
      title: "Project Notes",
      author: "You",
    },
    {
      id: "user-3",
      title: "Reading List",
      author: "You",
    },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between gap-4">
        {/* User Books - Left Column */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Books
          </h3>
          <div>
            {userBooks.map((book) => (
              <BookLink
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
              />
            ))}
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
