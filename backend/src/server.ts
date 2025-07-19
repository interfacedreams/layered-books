import { Hono } from "hono"
import { cors } from "hono/cors"
import book from "./routes/book"

const app = new Hono()
const PORT = process.env.PORT ?? 3000

app.use("*", cors({
  origin: "http://localhost:5173",
}))

app.get("/ping", (c) => c.text("pong"))

app.route("/book", book)

export default {
  port: PORT,
  fetch: app.fetch,
}
