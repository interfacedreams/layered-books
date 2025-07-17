import { Hono } from "hono"

const app = new Hono()

app.post("/", async (c) => {
  try {
    const formData = await c.req.formData()
    const fileEntry = formData.get("file")

    if (!fileEntry || !(fileEntry instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400)
    }

    return c.json({
      message: "File uploaded successfully",
      filename: fileEntry.name,
      size: fileEntry.size,
      type: fileEntry.type,
    })
  } catch (error) {
    return c.json({ error: "Upload failed" }, 500)
  }
})

export default app