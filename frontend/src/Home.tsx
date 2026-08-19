import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { fetchStatus, fetchUsersBooks, uploadBook } from "./api/books"
import BookPreview from "./BookPreview"
import ApiKeyModal, { getStoredApiKey } from "./ApiKeyModal"
import { getSessionId } from "./utils"

interface Book {
  id: string
  title: string
  author: string
}

export default function Home() {
  const queryClient = useQueryClient()
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: _statusData } = useQuery({
    queryKey: ["status", getStoredApiKey()],
    queryFn: fetchStatus,
  })

  const {
    data: booksData,
    isLoading,
    error,
    refetch: refetchBooks,
  } = useQuery({
    queryKey: ["allBooks"],
    queryFn: () => fetchUsersBooks(getSessionId()),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      uploadBook({ file, sessionId: getSessionId() }),
    onSuccess: () => {
      setUploadError(null)
      queryClient.invalidateQueries({ queryKey: ["allBooks"] })
    },
    onError: (err: Error) => {
      if (err.message === "API_KEY_REQUIRED") {
        setUploadError("Free tier exhausted. Please set your API key to continue.")
      } else {
        setUploadError(err.message)
      }
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
      id: "pe22wop6o1a7",
      title: "The Varieties of Religious Experience: A Study in Human Nature",
      author: "William James",
    },
    {
      id: "lm8ebjbfygk6",
      title: "The Origin of Species by Means of Natural Selection",
      author: "Charles Darwin",
    },
    {
      id: "iulfuvnhy8wk",
      title: "The Federalist Papers",
      author: "Alexander Hamilton et al.",
    },
    {
      id: "ujtu97pqmlzr",
      title: "The Nicomachean Ethics",
      author: "Aristotle",
    },
  ]

  // Show the error only when there is nothing to display. A background refetch
  // that fails still has cached books, so keep rendering those.
  const booksFailed = !isLoading && !booksData
  if (error) {
    console.error("Error loading books:", error)
  }

  return (
    <>
    <div className="p-4 max-w-4xl mx-auto">
      {/* Upload Section */}
      <h3 className="text-2xl font-semibold text-ink mb-6 text-center">
        Navigate a book using a nested summary
      </h3>
      <div
        {...getRootProps()}
        className={`w-full h-32 flex flex-col items-center justify-center cursor-pointer mb-8 rounded-lg transition-all bg-surface border-2 border-dashed border-line ${
          isDragActive ? "border-highlight bg-accent/25" : ""
        } ${uploadMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploadMutation.isPending && (
          <Loader2 className="h-8 w-8 mb-3 text-highlight animate-spin" />
        )}
        <div className="text-center">
          <span className="font-bold text-lg text-ink">
            {uploadMutation.isPending
              ? "Uploading..."
              : isDragActive
              ? "Drop EPUB here"
              : "Drag and drop EPUB"}
          </span>
          <p className="text-sm text-muted mt-1">
            {!uploadMutation.isPending &&
              "Generating the book outline with AI usually takes 1-3 minutes"}
          </p>
          {uploadError && (
            <p className="text-sm text-red-400 mt-1">{uploadError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Example Books - First on mobile, Right Column on desktop */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
            Example Books
          </h3>
          <div className="space-y-1">
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

        {/* User Books - Second on mobile, Left Column on desktop */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
            Your Books
          </h3>
          <div className="space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : booksFailed ? (
              <div className="py-4">
                <p className="text-sm text-red-400">
                  Couldn't load your books.
                </p>
                <button
                  type="button"
                  onClick={() => refetchBooks()}
                  className="mt-2 px-3 py-1.5 text-ink border border-line rounded-md text-sm font-medium hover:bg-accent/30 transition-all duration-200 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : booksData && booksData.length > 0 ? (
              booksData.map((book) => (
                <BookPreview
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                />
              ))
            ) : (
              <p className="text-muted">No books uploaded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
    <ApiKeyModal
      isOpen={showApiKeyModal}
      onClose={() => {
        setShowApiKeyModal(false)
        if (getStoredApiKey()) {
          setUploadError(null)
        }
      }}
    />
    </>
  )
}
