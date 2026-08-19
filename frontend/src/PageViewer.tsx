import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { BookChunk } from "./types"

interface BookViewerProps {
  chunks: BookChunk[]
  startChunkIndex?: number
  onClose?: () => void
  onSectionChange?: (chunkIndex: number) => void
}

export default function PageViewer({
  chunks,
  startChunkIndex = 0,
  onClose,
  onSectionChange,
}: BookViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [sections, setSections] = useState<string[]>([])
  const [sectionStartChunks, setSectionStartChunks] = useState<number[]>([])
  const MAX_CHARS_PER_SECTION = 900 // Character limit per section

  useEffect(() => {
    // Create full text string and chunk position mapping
    let text = ""
    const positions: number[] = []

    chunks.forEach((chunk, index) => {
      positions[index] = text.length
      text += chunk.text
      if (index < chunks.length - 1) {
        text += "\n\n" // Add double newline between chunks for paragraph separation
      }
    })

    // Split text into simple sections by character count
    const sectionList: string[] = []
    const words = text.split(" ")
    let currentSection = ""

    for (const word of words) {
      const testSection = currentSection + (currentSection ? " " : "") + word

      if (testSection.length > MAX_CHARS_PER_SECTION && currentSection) {
        sectionList.push(currentSection.trim())
        currentSection = word
      } else {
        currentSection = testSection
      }
    }

    // Add remaining content as final section
    if (currentSection.trim()) {
      sectionList.push(currentSection.trim())
    }

    setSections(sectionList)

    // Find starting section based on startChunkIndex
    const startPosition = positions[startChunkIndex] ?? 0
    let charCount = 0
    let startSection = 0

    for (let i = 0; i < sectionList.length; i++) {
      if (charCount + sectionList[i].length >= startPosition) {
        startSection = i
        break
      }
      charCount += sectionList[i].length
    }

    setCurrentSectionIndex(startSection)
  }, [chunks, startChunkIndex])

  const handlePrevSection = () => {
    setCurrentSectionIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextSection = () => {
    setCurrentSectionIndex((prev) => Math.min(sections.length - 1, prev + 1))
  }

  if (!chunks.length) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }

  const displayText = sections[currentSectionIndex] ?? ""

  return (
    <div className="h-full flex flex-col bg-core">
      {/* Header with section info and close button */}
      <div className="flex-shrink-0 p-3 border-b border-line flex justify-between items-center">
        <div className="text-sm">
          Section {currentSectionIndex + 1} of {sections.length}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-accent/30 transition-all duration-200 cursor-pointer flex items-center justify-center border border-line"
          >
            <X size={16} className="text-muted" />
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        <button
          type="button"
          onClick={handlePrevSection}
          disabled={currentSectionIndex === 0}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-surface hover:bg-accent/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center border border-line"
        >
          <ChevronLeft size={20} className="text-muted" />
        </button>

        <button
          type="button"
          onClick={handleNextSection}
          disabled={currentSectionIndex === sections.length - 1}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-surface hover:bg-accent/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center border border-line"
        >
          <ChevronRight size={20} className="text-muted" />
        </button>

        {/* Book content - fixed height, no scrolling */}
        <div className="h-full flex flex-col items-center pt-8">
          <div className="w-xl px-12">
            <div
              className="text-ink leading-relaxed whitespace-pre-wrap text-lg font-sans"
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
              }}
            >
              {displayText}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
