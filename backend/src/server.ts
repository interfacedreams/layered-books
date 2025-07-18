import { Hono } from "hono"
import generate from "./routes/generate"
import fetch from "./routes/fetch"

const app = new Hono()
const PORT = process.env.PORT ?? 3000

app.get("/ping", (c) => c.text("pong"))

app.route("/outline", generate)
app.route("/outline", fetch)

export default {
  port: PORT,
  fetch: app.fetch,
}
