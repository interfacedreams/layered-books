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
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)

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
      setCurrentItemId(null)
    }
  }

  const handleOpenReading = (itemId: string) => {
    if (!book) return

    // Level 0: Search only in chapters
    const chapter = book.outline.chapters.find((ch) => ch.id === itemId)
    if (chapter) {
      setStartChunkIndex(chapter.textStartChunk)
      setIsSplitViewOpen(true)
      return
    }

    // Level 1: Search in key points
    for (const chapter of book.outline.chapters) {
      if (chapter.keyPoints) {
        const keyPoint = chapter.keyPoints.find((kp) => kp.id === itemId)
        if (keyPoint) {
          setStartChunkIndex(keyPoint.textStartChunk)
          setIsSplitViewOpen(true)
          return
        }
      }
    }
    // Level 2: Search in key details
    for (const chapter of book.outline.chapters) {
      if (chapter.keyPoints) {
        for (const keyPoint of chapter.keyPoints) {
          if (keyPoint.keyDetails) {
            const keyDetail = keyPoint.keyDetails.find((kd) => kd.id === itemId)
            if (keyDetail) {
              setStartChunkIndex(keyDetail.textStartChunk)
              setIsSplitViewOpen(true)
              return
            }
          }
        }
      }
    }
  }

  const handleCloseSplitView = () => {
    setIsSplitViewOpen(false)
    setStartChunkIndex(0)
  }
  const handleSplitViewClick = () => {
    if (currentItemId) {
      handleOpenReading(currentItemId)
    } else {
      if (!book) return
      const firstItemId = book.outline.chapters[0].id
      handleOpenReading(firstItemId)
    }
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
    // note that this is only shown in the desktop view
    return (
      <div className="h-screen flex">
        {/* Left panel - Outline */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="pl-20 p-8">
            <BookPanel
              book={book}
              abstractionLevel={abstractionLevel}
              onAbstractionLevelChange={handleAbstractionLevelChange}
              onOpenReading={handleOpenReading}
              onSplitViewClick={handleSplitViewClick}
              isSplitViewOpen={isSplitViewOpen}
              currentItemId={currentItemId}
              setCurrentItemId={setCurrentItemId}
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
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <BookPanel
        book={book}
        abstractionLevel={abstractionLevel}
        onAbstractionLevelChange={handleAbstractionLevelChange}
        onOpenReading={handleOpenReading}
        onSplitViewClick={handleSplitViewClick}
        isSplitViewOpen={false}
        currentItemId={currentItemId}
        setCurrentItemId={setCurrentItemId}
      />
    </div>
  )
}
