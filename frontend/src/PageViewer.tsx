import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { BookChunk } from "./types"

interface BookViewerProps {
  chunks: BookChunk[]
  startChunkIndex?: number
  onClose?: () => void
}

export default function PageViewer({
  chunks,
  startChunkIndex = 0,
  onClose,
}: BookViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [sections, setSections] = useState<string[]>([])
  const MAX_CHARS_PER_SECTION = 2000 // Character limit per section
  const NEWLINE_CHAR_WEIGHT = 80 // Count newlines as equivalent to 80 characters

  useEffect(() => {
    // Create full text string and chunk position mapping
    let text = ""
    const positions: number[] = []

    chunks.forEach((chunk, index) => {
      positions[index] = text.length
      text += chunk.text
      if (index < chunks.length - 1) {
        text += " " // Add space between chunks
      }
    })

    // Split full text into sections accounting for newlines
    const sectionList: string[] = []
    let currentSection = ""
    let currentCharCount = 0

    for (let i = 0; i < text.length; i++) {
      const char = text[i]

      if (char === "\n") {
        currentCharCount += NEWLINE_CHAR_WEIGHT
        currentSection += char
      } else {
        currentCharCount += 1
        currentSection += char
      }

      // Check if we've reached the section limit
      if (
        currentCharCount >= MAX_CHARS_PER_SECTION &&
        currentSection.length > 0
      ) {
        // Try to break at a word boundary
        let breakPoint = currentSection.length
        for (
          let j = currentSection.length - 1;
          j >= Math.max(0, currentSection.length - 100);
          j--
        ) {
          if (currentSection[j] === " " || currentSection[j] === "\n") {
            breakPoint = j + 1
            break
          }
        }

        sectionList.push(currentSection.substring(0, breakPoint).trim())
        currentSection = currentSection.substring(breakPoint)
        currentCharCount = currentSection.length
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
    <div className="h-full flex flex-col bg-white">
      {/* Header with section info and close button */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 flex justify-between items-center">
        <div className="text-sm">
          Section {currentSectionIndex + 1} of {sections.length}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-sky-100 transition-all duration-200 cursor-pointer flex items-center justify-center border border-gray-100"
          >
            <X size={16} className="text-gray-700" />
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        <button
          type="button"
          onClick={handlePrevSection}
          disabled={currentSectionIndex === 0}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white hover:bg-sky-100 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center border border-gray-100"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>

        <button
          type="button"
          onClick={handleNextSection}
          disabled={currentSectionIndex === sections.length - 1}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white hover:bg-sky-100 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center border border-gray-100"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>

        {/* Book content - fixed height, no scrolling */}
        <div className="h-full flex flex-col items-center pt-20">
          <div className="w-xl px-12">
            <div
              className="text-gray-900 leading-relaxed whitespace-pre-wrap text-lg font-serif"
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                fontFamily: "Georgia, serif",
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
