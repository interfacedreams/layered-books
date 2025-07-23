import { Hono } from "hono"
import { cors } from "hono/cors"
import book from "./routes/book"

const app = new Hono()
const PORT = process.env.PORT ?? 3000

const allowedOrigins = ["http://localhost:5173"]
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)

app.get("/ping", (c) => c.text("pong"))

app.route("/book", book)

export default {
  port: PORT,
  fetch: app.fetch,
}
