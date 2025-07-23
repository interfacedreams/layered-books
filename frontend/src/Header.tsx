import { Link } from "react-router-dom"

export default function Header() {
  return (
    <header className="px-6 py-4 border-b border-gray-100 bg-sky-100">
      <Link to="/" className="hover:text-gray-700 transition-colors">
        <h1 className="text-xl font-bold text-gray-900">Layered Books</h1>
      </Link>
    </header>
  )
}
