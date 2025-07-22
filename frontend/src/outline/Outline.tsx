import { useEffect, useState } from "react"
import type { BookOutline } from "../types"
import OutlineItem from "./OutlineItem"
import { findPathToItem, transformOutlineToItems } from "./utils"

interface OutlineProps {
  outline: BookOutline
  abstractionLevel?: number
  onOpenReading?: (itemId: string, level: number) => void
}

export default function Outline({
  outline,
  abstractionLevel = 1,
  onOpenReading,
}: OutlineProps) {
  const [currentHash, setCurrentHash] = useState<string | null>(null)
  const [expansionPath, setExpansionPath] = useState<string[]>([])
  const [shouldScroll, setShouldScroll] = useState(false)
  const items = transformOutlineToItems(outline)

  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash.substring(1) || null
      setCurrentHash(newHash)
      const path = newHash ? findPathToItem(outline, newHash) : []
      setExpansionPath(path)
      setShouldScroll(!!newHash)
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [outline])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleItemClick = (id: string) => {
    window.location.hash = id
  }

  const handleScrollComplete = () => {
    setShouldScroll(false)
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
    <div className="bg-white">
      <ul>
        {items.map((item) => (
          <OutlineItem
            key={item.id}
            item={item}
            maxDepthExclusive={abstractionLevel}
            selectedItemId={currentHash}
            expansionPath={expansionPath}
            shouldScroll={shouldScroll}
            onItemClick={handleItemClick}
            onCopy={handleCopy}
            onLink={handleLink}
            onOpenReading={onOpenReading}
            onScrollComplete={handleScrollComplete}
          />
        ))}
      </ul>
    </div>
  )
}
