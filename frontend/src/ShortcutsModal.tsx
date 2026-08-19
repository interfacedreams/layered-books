import { X } from "lucide-react"
import { useEffect } from "react"

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string[]; separator?: string; action: string }[] = [
  { keys: ["J", "↓"], separator: "or", action: "Move to the next item" },
  { keys: ["K", "↑"], separator: "or", action: "Move to the previous item" },
  { keys: ["Enter"], action: "Expand or collapse the selected item" },
  {
    keys: ["⇧", "Enter"],
    separator: "+",
    action: "Open the reader at the selected item",
  },
]

export default function ShortcutsModal({
  isOpen,
  onClose,
}: ShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      data-modal-open
      className="fixed inset-0 bg-core/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-ink">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-ink hover:bg-accent/25 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted mb-4">
          These work anywhere on a book page, as long as you are not typing in a
          field.
        </p>

        <ul className="flex flex-col gap-3">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.action}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 flex-shrink-0">
                {shortcut.keys.map((key, index) => (
                  <span key={key} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <span className="text-xs text-muted">
                        {shortcut.separator}
                      </span>
                    )}
                    <kbd className="bg-core border border-line rounded-md px-2 py-1 text-xs font-medium text-ink min-w-8 text-center inline-block">
                      {key}
                    </kbd>
                  </span>
                ))}
              </span>
              <span className="text-sm text-muted text-right">
                {shortcut.action}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
