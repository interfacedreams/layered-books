import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import book from "./routes/book"

const app = new Hono()
app.use("*", logger())
const PORT = process.env.PORT ?? 3000

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"]
if (process.env.FRONTEND_DOMAINS) {
  const domains = process.env.FRONTEND_DOMAINS.split(",")
  for (const domain of domains) {
    allowedOrigins.push(`https://${domain}`)
    allowedOrigins.push(`https://www.${domain}`)
  }
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
