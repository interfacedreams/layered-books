import { Check, Copy, SquareSplitHorizontal } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { BookData } from "./api/books"
import AbstractionStepper from "./outline/AbstractionStepper"
import Outline from "./outline/Outline"
import { formatOutlineAsMarkdown } from "./outline/utils"

interface BookPanelProps {
  book: BookData
  abstractionLevel: number
  onAbstractionLevelChange: (newLevel: number) => void
  onOpenReading: (itemId: string) => void
  onSplitViewClick: () => void
  isSplitViewOpen: boolean
  currentItemId: string | null
  setCurrentItemId: (id: string | null) => void
  hasChunks: boolean
}

export default function BookPanel({
  book,
  abstractionLevel,
  onAbstractionLevelChange,
  onOpenReading,
  onSplitViewClick,
  isSplitViewOpen,
  currentItemId,
  setCurrentItemId,
  hasChunks,
}: BookPanelProps) {
  const [didCopyOutline, setDidCopyOutline] = useState(false)
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
    }
  }, [])

  const handleCopyOutline = async () => {
    try {
      await navigator.clipboard.writeText(formatOutlineAsMarkdown(book.outline))
      setDidCopyOutline(true)
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
      copyResetTimer.current = setTimeout(() => setDidCopyOutline(false), 2000)
    } catch (error) {
      console.error("Failed to copy outline:", error)
    }
  }

  return (
    <>
      <div className="mb-4">
        <h1 className={`font-semibold mb-1 text-2xl`}>{book.title}</h1>
        <p className={`mb-4 text-lg`}>By: {book.author}</p>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <AbstractionStepper
            value={abstractionLevel}
            onChange={onAbstractionLevelChange}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyOutline}
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-ink border border-line rounded-md text-sm font-medium hover:bg-accent/30 transition-all duration-200 cursor-pointer"
              title="Copy the full outline as Markdown"
              aria-label={didCopyOutline ? "Outline copied" : "Copy outline"}
            >
              {didCopyOutline ? <Check size={16} /> : <Copy size={16} />}
              <span className="hidden sm:inline">
                {didCopyOutline ? "Copied" : "Copy outline"}
              </span>
            </button>
            {!isSplitViewOpen && hasChunks && (
              <button
                type="button"
                onClick={onSplitViewClick}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-ink border border-line rounded-md text-sm font-medium hover:bg-accent/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SquareSplitHorizontal size={16} />
                Read in split view
              </button>
            )}
          </div>
        </div>
      </div>

      <Outline
        key={abstractionLevel}
        outline={book.outline}
        abstractionLevel={abstractionLevel}
        onOpenReading={onOpenReading}
        isSplitViewOpen={isSplitViewOpen}
        currentItemId={currentItemId}
        setCurrentItemId={setCurrentItemId}
        hasChunks={hasChunks}
      />
    </>
  )
}
