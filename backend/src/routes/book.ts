import { Hono } from "hono"

const app = new Hono()

// TODO: POST /summarize - process uploaded EPUB and generate book summary + outline
app.post("/summarize", async (c) => {
  // Will be implemented next - combines outline generation + summary generation
  return c.json({ message: "Not implemented yet" }, 501)
})

// TODO: GET /:bookId - fetch complete book data (summary + outline)
app.get("/:bookId", async (c) => {
  // Will be implemented next - returns combined book data
  return c.json({ message: "Not implemented yet" }, 501)
})

export default app