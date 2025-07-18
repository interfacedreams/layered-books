import { Hono } from "hono"
import { getOutline } from "../lib/outline/getOutline"

const app = new Hono()

app.get("/:bookId", async (c) => {
  try {
    const bookId = c.req.param("bookId")

    if (!bookId) {
      return c.json({ error: "Book ID is required" }, 400)
    }

    const outline = await getOutline(bookId)

    if (!outline) {
      return c.json({ error: "Book not found" }, 404)
    }

    return c.json(outline)
  } catch (error) {
    console.error("Error fetching outline:", error)
    if (error instanceof Error) {
      return c.json({ error: `Failed to fetch outline: ${error.message}` }, 500)
    }
    return c.json({ error: "Failed to fetch outline" }, 500)
  }
})

export default app
