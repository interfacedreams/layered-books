import { useEffect } from "react"
import type { FlatOutlineNode } from "./utils"

interface UseOutlineKeyboardParams {
  visibleItems: FlatOutlineNode[]
  currentItemId: string | null
  selectItem: (id: string) => void
  onActivate: (id: string) => void
  onOpenInReader: (id: string) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  )
}

const HANDLED_KEYS = new Set(["ArrowDown", "ArrowUp", "Enter"])

export default function useOutlineKeyboard({
  visibleItems,
  currentItemId,
  selectItem,
  onActivate,
  onOpenInReader,
}: UseOutlineKeyboardParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!HANDLED_KEYS.has(e.key)) return
      if (e.altKey) return
      // Shift/Cmd/Ctrl are only meaningful on Enter
      if (e.key !== "Enter" && (e.shiftKey || e.metaKey || e.ctrlKey)) return
      if (isTypingTarget(e.target)) return
      // a modal owns the keyboard while it is open
      if (document.querySelector("[data-modal-open]")) return
      if (visibleItems.length === 0) return

      const currentIndex = visibleItems.findIndex(
        (entry) => entry.item.id === currentItemId,
      )

      // Nothing selected yet: the first keypress just lands on the first item.
      if (currentIndex < 0) {
        e.preventDefault()
        selectItem(visibleItems[0].item.id)
        return
      }

      const { item } = visibleItems[currentIndex]

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault()
          const next = visibleItems[currentIndex + 1]
          if (next) selectItem(next.item.id)
          break
        }
        case "ArrowUp": {
          e.preventDefault()
          const prev = visibleItems[currentIndex - 1]
          if (prev) selectItem(prev.item.id)
          break
        }
        case "Enter": {
          e.preventDefault()
          if (e.shiftKey || e.metaKey || e.ctrlKey) {
            onOpenInReader(item.id)
          } else {
            onActivate(item.id)
          }
          break
        }
      }
    }

    // Listening on window means the outline responds without a click first.
    // preventDefault above also stops a focused row's native button activation
    // from double-firing on Enter.
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [visibleItems, currentItemId, selectItem, onActivate, onOpenInReader])
}
