import { BookOpenText, Copy, Link } from "lucide-react"

interface FloatingMenuProps {
  showIcons: boolean
  onCopy: (e: React.MouseEvent) => void
  onLink: (e: React.MouseEvent) => void
  onRead: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  hasChunks: boolean
}

export default function FloatingMenu({
  showIcons,
  onCopy,
  onLink,
  onRead,
  onMouseEnter,
  onMouseLeave,
  hasChunks,
}: FloatingMenuProps) {
  const actions = [
    {
      id: "copy",
      content: <Copy size={16} />,
      title: "Copy",
      onClick: onCopy,
    },
    {
      id: "link",
      content: <Link size={16} />,
      title: "Get link",
      onClick: onLink,
    },
    ...(hasChunks
      ? [
          {
            id: "read",
            content: <BookOpenText size={16} />,
            title: "Read from here",
            onClick: onRead,
          },
        ]
      : []),
  ]
  return (
    <>
      {showIcons && (
        <div
          className="absolute left-0 top-0 mt-1 transform -translate-x-full -ml-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="px-1 py-1 h-7 hover:bg-accent/30 hover:cursor-pointer rounded-md transition-colors"
              title={action.title}
            >
              {action.content}
            </button>
          ))}
        </div>
      )}

      <div
        className="absolute left-0 top-0 w-16 h-full transform -translate-x-full pointer-events-auto cursor-default"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => e.stopPropagation()}
      />
    </>
  )
}
