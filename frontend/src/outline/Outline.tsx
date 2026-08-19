import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { BookOutline } from "../types"
import OutlineItem from "./OutlineItem"
import useOutlineKeyboard from "./useOutlineKeyboard"
import {
  findPathToItem,
  flattenVisibleItems,
  getInitialExpandedIds,
  transformOutlineToItems,
} from "./utils"

interface OutlineProps {
  outline: BookOutline
  abstractionLevel?: number
  onOpenReading: (itemId: string) => void
  isSplitViewOpen: boolean
  currentItemId: string | null
  setCurrentItemId: (id: string | null) => void
  hasChunks: boolean
}

interface PendingScroll {
  id: string
  block: ScrollLogicalPosition
}

export default function Outline({
  outline,
  abstractionLevel = 1,
  onOpenReading,
  isSplitViewOpen,
  currentItemId,
  setCurrentItemId,
  hasChunks,
}: OutlineProps) {
  const items = useMemo(() => transformOutlineToItems(outline), [outline])
  // Expansion lives here rather than in each row so keyboard navigation can see
  // which rows are actually on screen.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    getInitialExpandedIds(items, abstractionLevel, []),
  )
  const [pendingScroll, setPendingScroll] = useState<PendingScroll | null>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())

  const visibleItems = useMemo(
    () => flattenVisibleItems(items, expandedIds),
    [items, expandedIds],
  )

  const registerItemRef = useCallback(
    (id: string, element: HTMLButtonElement | null) => {
      if (element) {
        itemRefs.current.set(id, element)
      } else {
        itemRefs.current.delete(id)
      }
    },
    [],
  )

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash.substring(1) || null
      setCurrentItemId(newHash)

      const path = newHash ? findPathToItem(outline, newHash) : []
      if (path.length > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev)
          for (const id of path) next.add(id)
          return next
        })
      }
      setPendingScroll(newHash ? { id: newHash, block: "center" } : null)
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [outline, setCurrentItemId])

  // Runs a render after pendingScroll is set, so a row revealed by the same
  // update (a deep link expanding its ancestors) has mounted and registered.
  useEffect(() => {
    if (!pendingScroll) return
    const element = itemRefs.current.get(pendingScroll.id)
    if (!element) return

    const rect = element.getBoundingClientRect()
    const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (!isInView) {
      element.scrollIntoView({ behavior: "smooth", block: pendingScroll.block })
    }
    setPendingScroll(null)
  }, [pendingScroll])

  // Selecting a row rewrites the URL instead of pushing to it, so the address
  // bar stays shareable while Back still returns to the previous page rather
  // than replaying every row the reader moved through. The current state object
  // has to be passed through: react-router keeps its position index there and
  // forces a full page reload if it goes missing.
  const selectItem = useCallback(
    (id: string) => {
      window.history.replaceState(window.history.state, "", `#${id}`)
      setCurrentItemId(id)
      // Focus follows selection so the browser's focus ring cannot linger on
      // the row that was clicked before the reader arrowed away from it.
      // Scrolling stays with pendingScroll, which knows about deep links.
      itemRefs.current.get(id)?.focus({ preventScroll: true })
      setPendingScroll({ id, block: "nearest" })
    },
    [setCurrentItemId],
  )

  // The split view assumes two side-by-side columns, so auto-opening is desktop
  // only. Matches the sm: breakpoint the "Read in split view" button uses.
  const canAutoOpenReader = useCallback(
    () => hasChunks && window.matchMedia("(min-width: 640px)").matches,
    [hasChunks],
  )

  // Clicking a row: the row itself toggles expansion, and an already-open
  // reader follows along. A leaf row has no expansion to toggle, so on desktop
  // its click opens the reader instead of doing nothing visible.
  const handleItemClick = useCallback(
    (id: string) => {
      selectItem(id)
      if (isSplitViewOpen) {
        onOpenReading(id)
        return
      }
      const entry = visibleItems.find((candidate) => candidate.item.id === id)
      if (!entry?.item.children?.length && canAutoOpenReader()) {
        onOpenReading(id)
      }
    },
    [
      selectItem,
      isSplitViewOpen,
      onOpenReading,
      visibleItems,
      canAutoOpenReader,
    ],
  )

  // Enter mirrors a click, so it toggles the row and keeps an open reader in
  // sync. Keyboard has no row component to do the toggling for it.
  const handleActivate = useCallback(
    (id: string) => {
      selectItem(id)
      const entry = visibleItems.find((candidate) => candidate.item.id === id)
      const hasChildren = !!entry?.item.children?.length
      if (hasChildren) toggleExpanded(id)
      if (isSplitViewOpen || (!hasChildren && canAutoOpenReader())) {
        onOpenReading(id)
      }
    },
    [
      selectItem,
      visibleItems,
      toggleExpanded,
      isSplitViewOpen,
      onOpenReading,
      canAutoOpenReader,
    ],
  )

  // Shift/Cmd+Enter is the "read from here" action: open the split view on this
  // item without disturbing whether the row is expanded.
  const handleOpenInReader = useCallback(
    (id: string) => {
      if (!hasChunks) return
      selectItem(id)
      onOpenReading(id)
    },
    [hasChunks, selectItem, onOpenReading],
  )

  useOutlineKeyboard({
    visibleItems,
    currentItemId,
    selectItem,
    onActivate: handleActivate,
    onOpenInReader: handleOpenInReader,
  })

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleLink = async (id: string) => {
    const baseUrl = window.location.href.split("#")[0]
    const url = `${baseUrl}#${id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  return (
    <div className="bg-core">
      <ul>
        {items.map((item) => (
          <OutlineItem
            key={item.id}
            item={item}
            selectedItemId={currentItemId}
            expandedIds={expandedIds}
            onToggleExpanded={toggleExpanded}
            registerItemRef={registerItemRef}
            onItemClick={handleItemClick}
            onCopy={handleCopy}
            onLink={handleLink}
            onOpenReading={onOpenReading}
            hasChunks={hasChunks}
          />
        ))}
      </ul>
    </div>
  )
}
