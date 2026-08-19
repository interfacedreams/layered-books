import { Link } from "react-router-dom"

interface BookLinkProps {
  id: string
  title: string
  author: string
}

export default function BookPreview({ id, title, author }: BookLinkProps) {
  return (
    <Link
      to={`/book/${id}`}
      className="group flex items-center gap-3 rounded-md p-3 bg-line transition-colors cursor-pointer hover:bg-accent/50"
    >
      <div className="min-w-0">
        {/* Two lines of height are always reserved so every card matches,
            whether the title wraps or not. 2 x leading-snug (1.375). */}
        <span className="block min-h-[2.75em] text-ink text-sm font-medium leading-snug line-clamp-2">
          {title}
        </span>
        <span className="block text-muted text-xs mt-1 line-clamp-1">
          {author}
        </span>
      </div>
    </Link>
  )
}
