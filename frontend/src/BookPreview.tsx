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
      className="relative group rounded-lg px-2 py-2 transition-colors flex-1 text-left cursor-pointer hover:bg-sky-200 bg-sky-100 block mb-2 h-20"
    >
      <div className="flex items-start gap-2 h-full">
        <span className="text-gray-600 text-sm mt-0.5 flex-shrink-0">→</span>
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <span className="text-gray-800 font-medium line-clamp-2 leading-5">
            {title}
          </span>
          <span className="text-gray-500 text-sm mt-1 line-clamp-1">
            {author}
          </span>
        </div>
      </div>
    </Link>
  )
}
