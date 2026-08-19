import clsx from "clsx"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import FloatingMenu from "./FloatingMenu"
import type { OutlineNode } from "./utils"

interface BulletItemProps {
  item: OutlineNode
  selectedItemId: string | null
  expandedIds: Set<string>
  onToggleExpanded: (id: string) => void
  registerItemRef: (id: string, element: HTMLButtonElement | null) => void
  onItemClick: (id: string) => void
  onCopy: (text: string) => void
  onLink: (id: string) => void
  onOpenReading: (id: string) => void
  hasChunks: boolean
}

export default function OutlineItem({
  item,
  selectedItemId,
  expandedIds,
  onToggleExpanded,
  registerItemRef,
  onItemClick,
  onCopy,
  onLink,
  onOpenReading,
  hasChunks,
}: BulletItemProps) {
  const [isItemHovered, setIsItemHovered] = useState(false)
  const [isIconAreaHovered, setIsIconAreaHovered] = useState(false)
  const showIcons = isItemHovered || isIconAreaHovered
  const isSelected = selectedItemId === item.id

  const isExpanded = expandedIds.has(item.id)
  const hasChildren = !!item.children?.length
  const shouldShowChildren = isExpanded && hasChildren
  const isChapter = item.depth === 0

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpanded(item.id)
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
          ref={(element) => registerItemRef(item.id, element)}
          type="button"
          className={clsx(
            "relative group rounded-lg sm:px-2 transition-colors flex-1 text-left cursor-pointer outline-none",
            // Hover sits a shade below selection so the pointer drifting over
            // rows never reads as a second selected row.
            isSelected ? "bg-accent/40" : showIcons && "bg-accent/20",
            isChapter ? "py-3" : "py-1",
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
                  className="text-muted mt-0.5 flex-shrink-0"
                />
              ) : (
                <ChevronRight
                  size={18}
                  className="text-muted mt-0.5 flex-shrink-0"
                />
              )
            ) : (
              <span className="text-muted text-sm mt-0.5 flex-shrink-0">
                •
              </span>
            )}
            <div className="flex flex-col flex-1">
              <span
                className={clsx(
                  "text-ink",
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
      </div>

      {shouldShowChildren && (
        <ul className="mt-1">
          {item.children?.map((child) => (
            <OutlineItem
              key={child.id}
              item={child}
              selectedItemId={selectedItemId}
              expandedIds={expandedIds}
              onToggleExpanded={onToggleExpanded}
              registerItemRef={registerItemRef}
              onItemClick={onItemClick}
              onCopy={onCopy}
              onLink={onLink}
              onOpenReading={onOpenReading}
              hasChunks={hasChunks}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export type { BulletItemProps }
