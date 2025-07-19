import { Route, Routes } from "react-router-dom"
import BookPage from "./BookPage"

function App() {
  return (
    <Routes>
      <Route path="/book/:bookId" element={<BookPage />} />
      <Route
        path="/"
        element={<div className="p-8">Welcome to Aperture</div>}
      />
    </Routes>
  )
}

export default App
