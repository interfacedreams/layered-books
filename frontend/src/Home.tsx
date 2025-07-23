import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { fetchUsersBooks, uploadBook } from "./api/books"
import BookPreview from "./BookPreview"
import { getSessionId } from "./utils"

interface Book {
  id: string
  title: string
  author: string
}

export default function Home() {
  const queryClient = useQueryClient()

  const {
    data: booksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allBooks"],
    queryFn: () => fetchUsersBooks(getSessionId()),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadBook(file, getSessionId()),
    onSuccess: () => {
      // Invalidate and refetch books after successful upload
      queryClient.invalidateQueries({ queryKey: ["allBooks"] })
    },
  })

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      uploadMutation.mutate(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/epub+zip": [".epub"],
    },
    multiple: false,
    disabled: uploadMutation.isPending,
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
    return null
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Upload Section */}
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
        Generate a layered book from your EPUB
      </h3>
      <div
        {...getRootProps()}
        className={`w-full h-32 flex flex-col items-center justify-center cursor-pointer mb-8 rounded-lg transition-all bg-sky-50 border-2 border-dashed border-gray-300 ${
          isDragActive ? "border-gray-400 bg-sky-100" : ""
        } ${uploadMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploadMutation.isPending && (
          <Loader2 className="h-8 w-8 mb-3 text-sky-500 animate-spin" />
        )}
        <div className="text-center">
          <span className="font-bold text-lg text-gray-900">
            {uploadMutation.isPending
              ? "Uploading..."
              : isDragActive
              ? "Drop EPUB here"
              : "Drag and drop or "}
            {!uploadMutation.isPending && !isDragActive && (
              <span className="text-sky-500">Click to upload</span>
            )}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            {!uploadMutation.isPending &&
              "Generating an outline usually takes ~2 mins"}
          </p>
          {uploadMutation.isError && (
            <p className="text-sm text-red-500 mt-1">
              Upload failed. Please try again.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-4">
        {/* User Books - Left Column */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Books
          </h3>
          <div>
            {booksData.length > 0 ? (
              booksData.map((book) => (
                <BookPreview
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
              <BookPreview
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
