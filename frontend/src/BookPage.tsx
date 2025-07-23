import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { fetchBook } from "./api/books"
import BookPanel from "./BookPanel"
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
    } else if (level === 2) {
      // Level 2: Search in key details
      let found = false
      for (const chapter of book.outline.chapters) {
        if (chapter.keyPoints && !found) {
          for (const keyPoint of chapter.keyPoints) {
            if (keyPoint.keyDetails) {
              const keyDetail = keyPoint.keyDetails.find(
                (kd) => kd.id === itemId
              )
              if (keyDetail) {
                startChunk = keyDetail.textStartChunk
                found = true
                break
              }
            }
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
      <div className="flex items-center justify-center min-h-screen">
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
          <div className="p-6 pl-20 pr-4">
            <BookPanel
              book={book}
              abstractionLevel={abstractionLevel}
              onAbstractionLevelChange={handleAbstractionLevelChange}
              onOpenReading={handleOpenReading}
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
      <BookPanel
        book={book}
        abstractionLevel={abstractionLevel}
        onAbstractionLevelChange={handleAbstractionLevelChange}
        onOpenReading={handleOpenReading}
      />
    </div>
  )
}
