import { Hono } from "hono"
import upload from "./routes/upload"

const app = new Hono()
const PORT = process.env.PORT ?? 3000

app.get("/ping", (c) => c.text("pong"))

app.route("/upload", upload)

export default {
  port: PORT,
  fetch: app.fetch,
}