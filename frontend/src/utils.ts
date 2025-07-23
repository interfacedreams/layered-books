export const getSessionId = (): string => {
  if (import.meta.env.VITE_NODE_ENV === "development") {
    return "1"
  }

  let sessionId = localStorage.getItem("aperture-session-id")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem("aperture-session-id", sessionId)
  }
  return sessionId!
}
