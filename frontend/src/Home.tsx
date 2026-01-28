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

  const { data: statusData } = useQuery({
    queryKey: ["status", getStoredApiKey()],
    queryFn: fetchStatus,
  })

  const {
    data: booksData,
    isLoading,
    error,
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
  ]

  if (error || (!isLoading && !booksData)) {
    console.error("Error loading books:", error)
    return null
  }

  return (
    <>
    <div className="p-4 max-w-4xl mx-auto">
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
              "Generating the book outline usually takes 1-3 minutes"}
          </p>
          {uploadError && (
            <p className="text-sm text-red-500 mt-1">{uploadError}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-4">
        {/* Example Books - First on mobile, Right Column on desktop */}
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

        {/* User Books - Second on mobile, Left Column on desktop */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Books
          </h3>
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
              <p className="text-gray-500">No books uploaded yet</p>
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
