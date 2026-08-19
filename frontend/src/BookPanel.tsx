import { SquareSplitHorizontal } from "lucide-react"
import type { BookData } from "./api/books"
import AbstractionStepper from "./outline/AbstractionStepper"
import Outline from "./outline/Outline"

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
  return (
    <>
      <div className="mb-4">
        <h1 className={`font-semibold mb-1 text-2xl`}>{book.title}</h1>
        <p className={`mb-4 text-lg`}>By: {book.author}</p>

        <div className="flex items-start justify-between">
          <AbstractionStepper
            value={abstractionLevel}
            onChange={onAbstractionLevelChange}
          />
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
