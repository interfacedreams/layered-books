import { Hono } from "hono"
import book from "./routes/book"
import devOutline from "./routes/dev/outline"

const app = new Hono()
const PORT = process.env.PORT ?? 3000

app.get("/ping", (c) => c.text("pong"))

// Production endpoints
app.route("/book", book)

// Development endpoints
app.route("/dev/outline", devOutline)

export default {
  port: PORT,
  fetch: app.fetch,
}
