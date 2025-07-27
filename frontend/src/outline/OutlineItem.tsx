import clsx from "clsx"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import FloatingMenu from "./FloatingMenu"

interface Item {
  id: string
  content: string
  description?: string
  depth: number
  children?: Item[]
}

interface BulletItemProps {
  item: Item
  maxDepthExclusive: number
  selectedItemId: string | null
  expansionPath: string[]
  shouldScroll: boolean
  onItemClick: (id: string) => void
  onCopy: (text: string) => void
  onLink: (id: string) => void
  onOpenReading: (id: string) => void
  onScrollComplete?: () => void
  hasChunks: boolean
}

export default function OutlineItem({
  item,
  maxDepthExclusive,
  selectedItemId,
  expansionPath,
  shouldScroll,
  onItemClick,
  onCopy,
  onLink,
  onOpenReading,
  onScrollComplete,
  hasChunks,
}: BulletItemProps) {
  const [isItemHovered, setIsItemHovered] = useState(false)
  const [isIconAreaHovered, setIsIconAreaHovered] = useState(false)
  const showIcons = isItemHovered || isIconAreaHovered
  const buttonRef = useRef<HTMLButtonElement>(null)
  const userClickedRef = useRef(false)
  const isSelected = selectedItemId === item.id

  const [isExpanded, setIsExpanded] = useState(
    item.depth < maxDepthExclusive || expansionPath.includes(item.id)
  )

  useEffect(() => {
    if (expansionPath.includes(item.id) && !userClickedRef.current) {
      // only expand items in the expansion path on first page load, not on manual clicks
      setIsExpanded(true)
    }
  }, [expansionPath, item.id])

  useEffect(() => {
    if (isSelected && shouldScroll && buttonRef.current) {
      const element = buttonRef.current
      const rect = element.getBoundingClientRect()
      const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight

      if (!isInView) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      onScrollComplete?.()
    }
  }, [isSelected, shouldScroll, onScrollComplete])

  const hasChildren = item.children && item.children.length > 0
  const shouldShowChildren = isExpanded && hasChildren
  const isChapter = item.depth === 0

  const handleClick = () => {
    if (hasChildren) {
      userClickedRef.current = true
      setIsExpanded(!isExpanded)
    }
    onItemClick(item.id)
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopy(item.content)
  }

  const handleLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLink(item.id)
  }

  const handleRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    onItemClick(item.id)
    onOpenReading(item.id)
  }

  return (
    <li className={clsx("list-none", "mb-1")}>
      <div className="flex w-full">
        <div style={{ width: `${item.depth * 24}px` }} />
        <button
          ref={buttonRef}
          type="button"
          className={clsx(
            "relative group rounded-lg sm:px-2 transition-colors flex-1 text-left cursor-pointer",
            "hover:bg-sky-100",
            (isSelected || isItemHovered) && "bg-sky-100",
            isChapter ? "py-3" : "py-1"
          )}
          onClick={handleClick}
          onMouseEnter={() => setIsItemHovered(true)}
          onMouseLeave={() => setIsItemHovered(false)}
        >
          <FloatingMenu
            showIcons={showIcons}
            onCopy={handleCopy}
            onLink={handleLink}
            onRead={handleRead}
            onMouseEnter={() => setIsIconAreaHovered(true)}
            onMouseLeave={() => setIsIconAreaHovered(false)}
            hasChunks={hasChunks}
          />

          <div className="flex items-start gap-2">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown
                  size={18}
                  className="text-gray-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <ChevronRight
                  size={18}
                  className="text-gray-600 mt-0.5 flex-shrink-0"
                />
              )
            ) : (
              <span className="text-gray-600 text-sm mt-0.5 flex-shrink-0">
                •
              </span>
            )}
            <div className="flex flex-col flex-1">
              <span
                className={clsx(
                  "text-gray-800",
                  isChapter && "text-lg font-semibold"
                )}
              >
                {item.content}
              </span>
              {isChapter && item.description && (
                <span className="mt-1">{item.description}</span>
              )}
            </div>
          </div>
        </button>
      </div>

      {shouldShowChildren && (
        <ul className="mt-1">
          {item.children?.map((child) => (
            <OutlineItem
              key={child.id}
              item={child}
              maxDepthExclusive={maxDepthExclusive}
              selectedItemId={selectedItemId}
              expansionPath={expansionPath}
              shouldScroll={shouldScroll}
              onItemClick={onItemClick}
              onCopy={onCopy}
              onLink={onLink}
              onOpenReading={onOpenReading}
              onScrollComplete={onScrollComplete}
              hasChunks={hasChunks}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export type { Item as OutlineItem, BulletItemProps }
