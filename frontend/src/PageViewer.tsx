import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import type { BookChunk } from "./types"

interface BookViewerProps {
  chunks: BookChunk[]
  startChunkNumber?: number
  onClose?: () => void
}

interface ViewportSize {
  width: number
  height: number
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  )
}

export default function PageViewer({
  chunks,
  startChunkNumber,
  onClose,
}: BookViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const chunkToPageRef = useRef(new Map<number, number>())
  const pageToChunkRef = useRef<number[]>([])
  const currentChunkRef = useRef(startChunkNumber ?? chunks[0]?.index ?? 1)
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  })
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateSize = () => {
      const nextSize = {
        width: Math.floor(viewport.clientWidth),
        height: Math.floor(viewport.clientHeight),
      }
      setViewportSize((previousSize) =>
        previousSize.width === nextSize.width &&
        previousSize.height === nextSize.height
          ? previousSize
          : nextSize,
      )
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(viewport)
    return () => resizeObserver.disconnect()
  }, [])

  useLayoutEffect(() => {
    const content = contentRef.current
    const { width, height } = viewportSize
    if (!content || chunks.length === 0 || width === 0 || height === 0) return

    let cancelled = false

    const measurePages = () => {
      if (cancelled) return

      const nextPageCount = Math.max(1, Math.ceil(content.scrollWidth / width))
      const contentRect = content.getBoundingClientRect()
      const chunkToPage = new Map<number, number>()
      const pageToChunk: number[] = []

      for (const element of content.querySelectorAll<HTMLElement>(
        "[data-chunk-number]",
      )) {
        const chunkNumber = Number(element.dataset.chunkNumber)
        if (!Number.isFinite(chunkNumber)) continue

        const range = document.createRange()
        range.selectNodeContents(element)
        range.collapse(true)
        const rect = range.getClientRects()[0] ?? element.getClientRects()[0]
        if (!rect) continue

        const pageIndex = Math.max(
          0,
          Math.min(
            nextPageCount - 1,
            Math.floor((rect.left - contentRect.left) / width),
          ),
        )
        chunkToPage.set(chunkNumber, pageIndex)
        pageToChunk[pageIndex] ??= chunkNumber
      }

      chunkToPageRef.current = chunkToPage
      pageToChunkRef.current = pageToChunk
      setPageCount(nextPageCount)
      setCurrentPageIndex(
        Math.min(
          nextPageCount - 1,
          chunkToPage.get(currentChunkRef.current) ?? 0,
        ),
      )
    }

    measurePages()
    void document.fonts?.ready.then(measurePages)
    return () => {
      cancelled = true
    }
  }, [chunks, viewportSize])

  useLayoutEffect(() => {
    const chunkNumber = startChunkNumber ?? chunks[0]?.index ?? 1
    currentChunkRef.current = chunkNumber
    const pageIndex = chunkToPageRef.current.get(chunkNumber)
    if (pageIndex !== undefined) setCurrentPageIndex(pageIndex)
  }, [chunks, startChunkNumber])

  const goToPage = useCallback(
    (pageIndex: number) => {
      const nextPageIndex = Math.max(0, Math.min(pageCount - 1, pageIndex))
      const chunkNumber = pageToChunkRef.current[nextPageIndex]
      if (chunkNumber !== undefined) currentChunkRef.current = chunkNumber
      setCurrentPageIndex(nextPageIndex)
    },
    [pageCount],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.altKey) return
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goToPage(currentPageIndex - 1)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        goToPage(currentPageIndex + 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPageIndex, goToPage])

  if (!chunks.length) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-core">
      <div className="flex-shrink-0 p-3 border-b border-line flex justify-between items-center">
        <div className="text-sm" aria-live="polite">
          Page {currentPageIndex + 1} of {pageCount}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reader"
            className="w-8 h-8 rounded-full bg-surface hover:bg-accent/30 transition-all duration-200 cursor-pointer flex items-center justify-center border border-line"
          >
            <X size={16} className="text-muted" />
          </button>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <button
          type="button"
          onClick={() => goToPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          aria-label="Previous page"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface hover:bg-accent/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center border border-line"
        >
          <ChevronLeft size={20} className="text-muted" />
        </button>

        <button
          type="button"
          onClick={() => goToPage(currentPageIndex + 1)}
          disabled={currentPageIndex === pageCount - 1}
          aria-label="Next page"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface hover:bg-accent/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center border border-line"
        >
          <ChevronRight size={20} className="text-muted" />
        </button>

        <div
          ref={viewportRef}
          className="absolute inset-y-8 left-16 right-16 overflow-hidden"
        >
          {viewportSize.width > 0 && viewportSize.height > 0 && (
            <div
              ref={contentRef}
              className="text-ink text-base font-sans"
              style={{
                width: `${viewportSize.width}px`,
                height: `${viewportSize.height}px`,
                columnWidth: `${viewportSize.width}px`,
                columnGap: "0px",
                columnFill: "auto",
                lineHeight: 1.6,
                transform: `translateX(-${currentPageIndex * viewportSize.width}px)`,
              }}
            >
              {chunks.map((chunk) => (
                <p
                  key={chunk.index}
                  data-chunk-number={chunk.index}
                  className="m-0 mb-4 break-words"
                  style={{ orphans: 2, widows: 2, overflowWrap: "anywhere" }}
                >
                  {chunk.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
