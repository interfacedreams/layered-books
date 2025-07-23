import type { BookData } from "./api/books"
import AbstractionStepper from "./outline/AbstractionStepper"
import Outline from "./outline/Outline"

interface BookPanelProps {
  book: BookData
  abstractionLevel: number
  onAbstractionLevelChange: (newLevel: number) => void
  onOpenReading: (itemId: string, level: number) => void
  isSplitViewOpen: boolean
}

export default function BookPanel({
  book,
  abstractionLevel,
  onAbstractionLevelChange,
  onOpenReading,
  isSplitViewOpen,
}: BookPanelProps) {
  return (
    <>
      <div className="mb-4">
        <h1 className={`font-bold mb-1 text-2xl`}>{book.title}</h1>
        <p className={`mb-4 text-lg`}>By: {book.author}</p>

        <AbstractionStepper
          value={abstractionLevel}
          onChange={onAbstractionLevelChange}
        />
      </div>

      <Outline
        key={abstractionLevel}
        outline={book.outline}
        abstractionLevel={abstractionLevel}
        onOpenReading={onOpenReading}
        isSplitViewOpen={isSplitViewOpen}
      />
    </>
  )
}
