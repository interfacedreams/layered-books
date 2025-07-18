import { Hono } from "hono"
import fetch from "./routes/fetch"
import generate from "./routes/generate"

const app = new Hono()
const PORT = process.env.PORT ?? 3000

app.get("/ping", (c) => c.text("pong"))

app.route("/outline", generate)
app.route("/outline", fetch)

export default {
  port: PORT,
  fetch: app.fetch,
}
