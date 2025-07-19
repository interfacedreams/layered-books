import { ChevronDown, ChevronRight, Copy, Link } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface Item {
  id: string
  content: string
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
  const isSelected = selectedItemId === item.id

  const [isExpanded, setIsExpanded] = useState(
    item.depth < maxDepthExclusive || expansionPath.includes(item.id),
  )

  useEffect(() => {
    if (expansionPath.includes(item.id)) {
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

  const handleClick = () => {
    if (hasChildren) {
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

  return (
    <li className="list-none">
      <button
        ref={buttonRef}
        type="button"
        className={`
          relative group rounded-lg py-1 px-2 transition-colors w-full text-left cursor-pointer
          ${isSelected ? "bg-gray-100" : isItemHovered ? "bg-gray-50" : ""}
          hover:bg-gray-50
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsItemHovered(true)}
        onMouseLeave={() => setIsItemHovered(false)}
        style={{ marginLeft: `${item.depth * 24}px` }}
      >
        {showIcons && (
          <div
            className="absolute left-0 top-0 mt-1 transform -translate-x-full -ml-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onMouseEnter={() => setIsIconAreaHovered(true)}
            onMouseLeave={() => setIsIconAreaHovered(false)}
          >
            <button
              type="button"
              onClick={handleCopy}
              className="text-gray-600 cursor-pointer hover:text-black transition-colors"
              title="Copy"
            >
              <Copy size={16} />
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="text-gray-600 cursor-pointer hover:text-black transition-colors"
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
          <span className="text-gray-800">{item.content}</span>
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
