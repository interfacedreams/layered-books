import { Route, Routes } from "react-router-dom"
import BookPage from "./BookPage"
import Header from "./Header"
import Home from "./Home"

function App() {
  return (
    <div className="min-h-screen bg-core">
      <Header />

      {/* Main content */}
      <main className="flex-1">
        <Routes>
          <Route path="/book/:bookId" element={<BookPage />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
