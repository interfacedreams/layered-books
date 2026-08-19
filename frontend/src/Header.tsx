import { Key, Keyboard } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import ApiKeyModal, { getStoredApiKey } from "./ApiKeyModal"
import ShortcutsModal from "./ShortcutsModal"

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const hasApiKey = !!getStoredApiKey()

  return (
    <>
      <header className="sticky top-0 z-30 h-16 px-6 flex items-center border-b border-line bg-accent">
        <div className="w-full flex items-center justify-between max-w-6xl mx-auto">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <h1 className="text-xl text-ink">Layered Books</h1>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="flex items-center p-1.5 rounded-md text-ink bg-core/40 hover:bg-core/60 cursor-pointer transition-colors"
              title="Keyboard shortcuts"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors font-medium bg-core/40 text-ink hover:bg-core/60"
            >
              <Key className="h-4 w-4" />
              {hasApiKey ? "API Key Set" : "Set API Key"}
            </button>
          </div>
        </div>
      </header>
      <ApiKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  )
}
