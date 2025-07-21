import clsx from "clsx"
import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Copy,
  Link,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

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
  onScrollComplete?: () => void
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
  onScrollComplete,
}: BulletItemProps) {
  const [isItemHovered, setIsItemHovered] = useState(false)
  const [isIconAreaHovered, setIsIconAreaHovered] = useState(false)
  const showIcons = isItemHovered || isIconAreaHovered
  const buttonRef = useRef<HTMLButtonElement>(null)
  const userClickedRef = useRef(false)
  const isSelected = selectedItemId === item.id

  const [isExpanded, setIsExpanded] = useState(
    item.depth < maxDepthExclusive || expansionPath.includes(item.id),
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
    console.log(`Read button clicked for item:`, {
      id: item.id,
      content: item.content,
      depth: item.depth,
    })
  }

  return (
    <li className={clsx("list-none", isChapter && "mb-1")}>
      <button
        ref={buttonRef}
        type="button"
        className={clsx(
          "relative group rounded-lg px-2 transition-colors w-full text-left cursor-pointer",
          "hover:bg-gray-100",
          (isSelected || isItemHovered) && "bg-gray-100",
          isChapter ? "py-3" : "py-1",
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsItemHovered(true)}
        onMouseLeave={() => setIsItemHovered(false)}
        style={{ marginLeft: `${item.depth * 24}px` }}
      >
        {showIcons && (
          <div
            className="absolute left-0 top-0 mt-1 transform -translate-x-full -ml-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onMouseEnter={() => setIsIconAreaHovered(true)}
            onMouseLeave={() => setIsIconAreaHovered(false)}
          >
            {(item.depth === 0 || item.depth === 1) && (
              <button
                type="button"
                onClick={handleRead}
                className="px-2 py-1 text-sm bg-sky-200 hover:bg-sky-300 text-gray-700 hover:text-gray-900 rounded-md transition-colors flex items-center gap-1.5"
                title="Read from here"
              >
                <BookOpenText size={14} />
                Read
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 bg-sky-200 hover:bg-sky-300 text-gray-700 hover:text-gray-900 rounded-md transition-colors"
              title="Copy"
            >
              <Copy size={16} />
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="p-1.5 bg-sky-200 hover:bg-sky-300 text-gray-700 hover:text-gray-900 rounded-md transition-colors"
              title="Get link"
            >
              <Link size={16} />
            </button>
          </div>
        )}

        <div
          className="absolute left-0 top-0 w-16 h-full transform -translate-x-full pointer-events-auto cursor-default"
          onMouseEnter={() => setIsIconAreaHovered(true)}
          onMouseLeave={() => setIsIconAreaHovered(false)}
          onClick={(e) => e.stopPropagation()}
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
                isChapter && "text-lg font-semibold",
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

      {shouldShowChildren && (
        <ul>
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
              onScrollComplete={onScrollComplete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export type { Item as OutlineItem, BulletItemProps }
