import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { fetchBook } from "./api/books"
import AbstractionStepper from "./outline/AbstractionStepper"
import Outline from "./outline/Outline"
import PageViewer from "./PageViewer"
import { getSessionId } from "./utils"

export default function BookPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const [abstractionLevel, setAbstractionLevel] = useState(0)
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false)
  const [startChunkIndex, setStartChunkIndex] = useState(0)

  const {
    data: book,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => fetchBook(bookId!, getSessionId()),
    enabled: !!bookId,
  })

  const handleAbstractionLevelChange = (newLevel: number) => {
    setAbstractionLevel(newLevel)

    // Always clear current selection when abstraction level changes
    const currentHash = window.location.hash.substring(1)
    if (currentHash) {
      window.location.hash = ""
    }
  }

  const handleOpenReading = (itemId: string, level: number) => {
    if (!book) return

    let startChunk = 0

    if (level === 0) {
      // Level 0: Search only in chapters
      const chapter = book.outline.chapters.find((ch) => ch.id === itemId)
      if (chapter) {
        startChunk = chapter.textStartChunk
      }
    } else if (level === 1) {
      // Level 1: Search in key points
      for (const chapter of book.outline.chapters) {
        if (chapter.keyPoints) {
          const keyPoint = chapter.keyPoints.find((kp) => kp.id === itemId)
          if (keyPoint) {
            startChunk = keyPoint.textStartChunk
            break
          }
        }
      }
    }

    setStartChunkIndex(startChunk)
    setIsSplitViewOpen(true)
  }

  const handleCloseSplitView = () => {
    setIsSplitViewOpen(false)
    setStartChunkIndex(0)
  }

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

  if (isSplitViewOpen) {
    return (
      <div className="h-screen flex">
        {/* Left panel - Outline */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="p-6 pl-40 pr-16">
            <div className="mb-4">
              <h1 className="text-2xl font-bold mb-1">{book.title}</h1>
              <p className="text-lg mb-4">By: {book.author}</p>

              <AbstractionStepper
                value={abstractionLevel}
                onChange={handleAbstractionLevelChange}
              />
            </div>

            <Outline
              key={abstractionLevel}
              outline={book.outline}
              abstractionLevel={abstractionLevel}
              onOpenReading={(itemId) =>
                handleOpenReading(itemId, abstractionLevel)
              }
            />
          </div>
        </div>

        {/* Right panel - Page viewer */}
        <div className="w-1/2">
          <PageViewer
            chunks={book.outline.chunks}
            startChunkIndex={startChunkIndex}
            onClose={handleCloseSplitView}
          />
        </div>
      </div>
    )
  }

  // Regular outline view
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
      <p className="text-xl mb-8">By: {book.author}</p>

      <AbstractionStepper
        value={abstractionLevel}
        onChange={handleAbstractionLevelChange}
      />

      <Outline
        key={abstractionLevel}
        outline={book.outline}
        abstractionLevel={abstractionLevel}
        onOpenReading={(itemId) => handleOpenReading(itemId, abstractionLevel)}
      />
    </div>
  )
}
